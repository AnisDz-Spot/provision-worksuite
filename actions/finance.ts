"use server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Helper to verify project access
 */
async function verifyProjectAccess(
  projectId: number,
  userUid: string,
  userRole: string,
) {
  if (["admin", "global-admin", "manager"].includes(userRole)) return true; // simplified global check

  const dbUser = await prisma.user.findUnique({ where: { uid: userUid } });
  if (!dbUser) return false;

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: dbUser.id,
      },
    },
  });

  if (!member || ["viewer"].includes(member.role)) {
    return false;
  }
  return true;
}

export async function addExpense(input: FormData | any) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  let projectId: number;
  let amount: number;
  let description: string;
  let vendor: string;
  let dateStr: string;

  if (input instanceof FormData) {
    projectId = Number(input.get("projectId"));
    amount = Number(input.get("amount"));
    description =
      (input.get("description") as string) || (input.get("note") as string);
    vendor = input.get("vendor") as string;
    dateStr = input.get("date") as string;
  } else {
    projectId = Number(input.projectId);
    amount = Number(input.amount);
    description = input.note || input.description;
    vendor = input.vendor;
    dateStr =
      input.date instanceof Date
        ? input.date.toISOString()
        : String(input.date);
  }

  if (!projectId || !amount || !description || !dateStr) {
    return {
      success: false,
      error:
        "Missing required fields (projectId, amount, note/description, date)",
    };
  }

  const hasAccess = await verifyProjectAccess(projectId, user.uid, user.role);
  if (!hasAccess) {
    return { success: false, error: "Forbidden: Insufficient permissions" };
  }

  try {
    const uid = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Transaction: Create Expense + Update Project Spent
    const [expense] = await prisma.$transaction([
      prisma.expense.create({
        data: {
          uid,
          projectId,
          amount,
          note: description,
          vendor: vendor || null,
          date: new Date(dateStr),
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          spent: { increment: amount },
        },
      }),
    ]);

    revalidatePath(`/projects`);
    // Ideally specific project path, assuming /projects/[uid]
    // We can't easily get UID here unless we query project first or pass it.
    // revalidatePath('/projects/[id]') works if generic, but usually exact path needed.
    // For now revalidating layout or list is safe.

    return { success: true, data: expense };
  } catch (error: any) {
    console.error("Failed to add expense:", error);
    return { success: false, error: "Failed to add expense" };
  }
}

export async function createInvoice(data: any) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const {
    projectId,
    clientName,
    issueDate,
    dueDate,
    items,
    status,
    notes,
    total,
  } = data;
  const pId = Number(projectId);

  if (!pId || !clientName || !items || items.length === 0) {
    return { success: false, error: "Invalid invoice data" };
  }

  const hasAccess = await verifyProjectAccess(pId, user.uid, user.role);
  if (!hasAccess) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const uid = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const invoice = await prisma.invoice.create({
      data: {
        uid,
        projectId: pId,
        clientName,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: status || "draft",
        total: Number(total),
        items: items || [], // Prisma usually handles JSON array if mapped to Json
        notes: notes || null,
      },
    });

    revalidatePath(`/projects`);
    return { success: true, data: invoice };
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProjectBudget(projectUid: string, budget: number) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Check access
  const project = await prisma.project.findUnique({
    where: { uid: projectUid },
  });
  if (!project) return { success: false, error: "Project not found" };

  // Reuse verifyProjectAccess logic manually or via helper if possible
  // Since helper uses ID and we have it from project found:
  const hasAccess = await verifyProjectAccess(project.id, user.uid, user.role);
  if (!hasAccess) return { success: false, error: "Forbidden" };

  try {
    await prisma.project.update({
      where: { uid: projectUid },
      data: { budget },
    });

    revalidatePath(`/projects`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Failed to update budget" };
  }
}
