import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";

/**
 * PUT /api/departments/[id]
 * Update a department
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, description, adminId } = body;

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        description,
        adminId: adminId ? parseInt(adminId) : null,
      },
    });

    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    console.error("[Departments API] PUT Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update department" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/departments/[id]
 * Delete a department
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Department deleted" });
  } catch (error: any) {
    console.error("[Departments API] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
