import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Simple schema for invoice creation
const createInvoiceSchema = z.object({
  projectId: z.number().optional(), // Either projectId or ensure it's derived
  milestoneId: z.string().optional(),
  clientName: z.string(),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime(),
  status: z
    .enum(["draft", "sent", "paid", "overdue", "cancelled"])
    .default("draft"),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().default(1),
      rate: z.number(),
      amount: z.number(),
    })
  ),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params for filtering
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  try {
    const whereClause: any = {};
    if (projectId) {
      whereClause.projectId = parseInt(projectId);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            uid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: Request) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const body = await req.json();
      const validation = createInvoiceSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validation.error },
          { status: 400 }
        );
      }

      const { projectId, milestoneId, items, ...invoiceData } = validation.data;

      // Resolve Project ID if missing but milestone ID present
      let targetProjectId = projectId;
      if (!targetProjectId && milestoneId) {
        const milestone = await prisma.milestone.findUnique({
          where: { id: milestoneId },
          select: { projectId: true },
        });
        if (milestone) targetProjectId = milestone.projectId;
        else
          return NextResponse.json(
            { error: "Milestone not found" },
            { status: 404 }
          );
      }

      if (!targetProjectId) {
        return NextResponse.json(
          { error: "Project ID required" },
          { status: 400 }
        );
      }

      // Verify access
      const dbUser = await prisma.user.findUnique({ where: { uid: user.uid } });
      if (!dbUser)
        return NextResponse.json({ error: "User not found" }, { status: 404 });

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: targetProjectId,
            userId: dbUser.id,
          },
        },
      });

      const isGlobalAdmin = ["admin", "global-admin"].includes(user.role);
      if (
        !isGlobalAdmin &&
        (!member || ["viewer", "member"].includes(member.role))
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Calculate total
      const total = items.reduce((acc, item) => acc + item.amount, 0);

      const uid = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const invoice = await prisma.invoice.create({
        data: {
          uid,
          projectId: targetProjectId,
          ...invoiceData,
          items: items, // JSON
          total,
          status: invoiceData.status || "draft",
          issueDate: invoiceData.issueDate
            ? new Date(invoiceData.issueDate)
            : new Date(),
          dueDate: new Date(invoiceData.dueDate),
        },
      });

      return NextResponse.json({ success: true, data: invoice });
    } catch (error) {
      console.error("Failed to create invoice:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
