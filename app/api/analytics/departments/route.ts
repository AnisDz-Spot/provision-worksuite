import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";
import { calculateProjectHealth } from "@/lib/project-health";
import { getTaskCompletionForProject } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all departments
    const departments = await prisma.department.findMany({
      include: {
        projects: {
          select: {
            id: true,
            status: true,
            progress: true,
            deadline: true,
            budget: true,
            spent: true,
            _count: {
              select: { members: true },
            },
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    const stats = departments.map((dept) => {
      const projects = dept.projects;
      const totalProjects = projects.length;

      if (totalProjects === 0) {
        return {
          id: dept.id,
          name: dept.name,
          projectCount: 0,
          userCount: dept._count.users,
          avgHealth: 100,
          completionRate: 0,
          avgMemberPerProject: 0,
          statusDistribution: {
            active: 0,
            completed: 0,
            on_hold: 0,
            cancelled: 0,
          },
        };
      }

      // Calculate aggregated metrics
      let totalHealth = 0;
      let completedCount = 0;
      let totalMembers = 0;
      const statusDist: Record<string, number> = {
        active: 0,
        completed: 0,
        on_hold: 0,
        cancelled: 0,
      };

      projects.forEach((p) => {
        // Health calculation
        const health = calculateProjectHealth({
          progress: p.progress || 0,
          deadline: p.deadline ? p.deadline.toISOString() : undefined,
          status: p.status,
          budget: p.budget || 0,
          spent: p.spent || 0,
        });
        totalHealth += health.score;

        // Completion check
        if (p.status === "completed") completedCount++;

        // Status distribution
        const s = (p.status || "active").toLowerCase();
        statusDist[s] = (statusDist[s] || 0) + 1;

        // Members
        totalMembers += p._count.members;
      });

      return {
        id: dept.id,
        name: dept.name,
        projectCount: totalProjects,
        userCount: dept._count.users,
        avgHealth: Math.round(totalHealth / totalProjects),
        completionRate: Math.round((completedCount / totalProjects) * 100),
        avgMemberPerProject: Number((totalMembers / totalProjects).toFixed(1)),
        statusDistribution: statusDist,
      };
    });

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error("[Dept Analytics API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch departmental analytics" },
      { status: 500 }
    );
  }
}
