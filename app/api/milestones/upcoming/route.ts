import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all pending milestones with a due date in the future
    const now = new Date();
    const milestones = await prisma.milestone.findMany({
      where: {
        dueDate: {
          gt: now,
        },
        status: {
          not: "completed",
        },
      },
      include: {
        project: {
          select: {
            name: true,
            uid: true,
            status: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    console.error("Failed to fetch upcoming milestones:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
