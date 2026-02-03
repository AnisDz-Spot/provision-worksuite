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

    // Fetch all members with their tasks
    const members = await prisma.user.findMany({
      where: {
        role: { not: "ADMIN" }, // Only non-admins for workload tracking
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        _count: {
          select: {
            tasks: true,
          },
        },
        tasks: {
          where: {
            status: { notIn: ["completed", "cancelled"] },
          },
          select: {
            id: true,
            priority: true,
            status: true,
          },
        },
      },
    });

    const resourceLoad = members
      .map((m: any) => {
        const activeTasks = m.tasks.length;
        const highPriority = m.tasks.filter(
          (t: any) => t.priority === "high" || t.priority === "urgent",
        ).length;

        let loadLevel: "low" | "medium" | "high" | "critical" = "low";
        if (activeTasks > 8 || highPriority > 3) loadLevel = "critical";
        else if (activeTasks > 5) loadLevel = "high";
        else if (activeTasks > 2) loadLevel = "medium";

        return {
          id: m.id,
          name: m.name,
          avatarUrl: m.avatarUrl,
          taskCount: activeTasks,
          highPriorityCount: highPriority,
          loadLevel,
          score: activeTasks * 10 + highPriority * 20,
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json({
      success: true,
      data: resourceLoad,
    });
  } catch (error) {
    console.error("Resource Load API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resource load" },
      { status: 500 },
    );
  }
}
