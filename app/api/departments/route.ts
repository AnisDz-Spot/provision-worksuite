import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";

/**
 * GET /api/departments
 * Fetch all departments with their admins and member counts
 */
export async function GET(req: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        admin: {
          select: {
            uid: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error: any) {
    console.error("[Departments API] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch departments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/departments
 * Create a new department
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, adminId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if name already exists
    const existing = await prisma.department.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Department name already exists" },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        description,
        adminId: adminId ? parseInt(adminId) : undefined,
      },
    });

    return NextResponse.json({ success: true, data: department });
  } catch (error: any) {
    console.error("[Departments API] POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create department" },
      { status: 500 }
    );
  }
}
