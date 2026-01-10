import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
// Helper to check permissions
async function checkProjectPermission(
  userId: string | number | undefined,
  projectId: number,
  allowedRoles: string[] | null = null // null means any member
) {
  const uid = Number(userId);
  if (isNaN(uid)) return false;

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: uid,
      },
    },
  });

  if (!member) return false;
  if (!allowedRoles) return true; // Any member
  return allowedRoles.includes(member.role);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { uid: id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            uid: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Authorization
    const isGlobalAdmin = ["admin", "global-admin"].includes(user.role);
    if (!isGlobalAdmin) {
      const hasAccess = await checkProjectPermission(
        user.id,
        invoice.projectId
      );
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const PUT = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
      const body = await req.json();

      // Check existence and get projectId
      const existing = await prisma.invoice.findUnique({ where: { uid: id } });
      if (!existing) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }

      // Authorization
      const isGlobalAdmin = ["admin", "global-admin"].includes(user.role);
      if (!isGlobalAdmin) {
        // Only owner and admin can edit invoices
        const canEdit = await checkProjectPermission(
          user.id,
          existing.projectId,
          ["owner", "admin"]
        );
        if (!canEdit) {
          return NextResponse.json(
            { error: "Forbidden: Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      const { items } = body;
      let total = existing.total;

      // Recalculate total if items changed
      if (items && Array.isArray(items)) {
        total = items.reduce(
          (acc: number, item: any) => acc + (item.amount || 0),
          0
        );
      }

      const updated = await prisma.invoice.update({
        where: { uid: id },
        data: {
          ...body,
          total,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        },
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error("Failed to update invoice:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    try {
      const existing = await prisma.invoice.findUnique({ where: { uid: id } });
      if (!existing) {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }

      // Authorization
      const isGlobalAdmin = ["admin", "global-admin"].includes(user.role);
      if (!isGlobalAdmin) {
        // Only owner and admin can delete invoices
        const canDelete = await checkProjectPermission(
          user.id,
          existing.projectId,
          ["owner", "admin"]
        );
        if (!canDelete) {
          return NextResponse.json(
            { error: "Forbidden: Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      await prisma.invoice.delete({
        where: { uid: id },
      });

      return NextResponse.json({ success: true, message: "Invoice deleted" });
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
);
