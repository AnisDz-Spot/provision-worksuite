import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_DASHBOARD_STATS } from "@/lib/mock-data";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // In demo mode or for global admin, return mock stats
  if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
    return NextResponse.json({
      success: true,
      data: MOCK_DASHBOARD_STATS,
      source: "mock",
    });
  }

  try {
    // Fetch full user from DB to get the Integer ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      // If user exists in token but not in DB (edge case), return empty stats
      return NextResponse.json({
        success: true,
        data: {
          totalProjects: 0,
          completedTasks: 0,
          activeUsers: 0,
          upcomingDeadlines: 0,
        },
      });
    }

    const isAdmin = dbUser.role === "admin" || dbUser.role === "global-admin";
    const userId = dbUser.id;

    // 1. Projects Count
    const totalProjectsCount = await prisma.project.count({
      where: isAdmin
        ? {}
        : {
            OR: [{ userId: userId }, { members: { some: { userId: userId } } }],
          },
    });
    const activeProjectsCount = await prisma.project.count({
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [{ userId: userId }, { members: { some: { userId: userId } } }],
            archivedAt: null,
          },
    });

    // 2. Tasks Count (Completed vs Pending)
    const totalTasksCount = await prisma.task.count({
      where: isAdmin
        ? {}
        : {
            OR: [
              { project: { userId: userId } },
              { project: { members: { some: { userId: userId } } } },
              { assigneeId: userId },
            ],
          },
    });
    const completedTasksCount = await prisma.task.count({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { project: { userId: userId } },
                { project: { members: { some: { userId: userId } } } },
                { assigneeId: userId },
              ],
            }),
        status: { in: ["done", "completed"] },
      },
    });

    // 3. Active Users
    const totalUsersCount = await prisma.user.count();
    // For "Active" we'll use users who have a session created in the last 24h as a proxy
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsersCount = await prisma.user.count({
      where: {
        sessions: {
          some: {
            createdAt: { gte: yesterday },
          },
        },
      },
    });

    // 4. Upcoming Deadlines (Next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const projectsWithDeadlinesCount = await prisma.project.count({
      where: {
        archivedAt: null,
        deadline: { not: null },
        ...(isAdmin
          ? {}
          : {
              OR: [
                { userId: userId },
                { members: { some: { userId: userId } } },
              ],
            }),
      },
    });

    const upcomingDeadlinesCount = await prisma.project.count({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { userId: userId },
                { members: { some: { userId: userId } } },
              ],
            }),
        archivedAt: null,
        deadline: {
          gt: new Date(),
          lte: nextWeek,
        },
      },
    });

    // Generate simple trend data based on creation dates for the last 7 days
    const getTrend = async (model: any, whereBase: any) => {
      const days = [6, 5, 4, 3, 2, 1, 0];
      return Promise.all(
        days.map((d) => {
          const start = new Date();
          start.setDate(start.getDate() - d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setHours(23, 59, 59, 999);

          return (prisma as any)[model].count({
            where: {
              ...whereBase,
              createdAt: { lte: end },
            },
          });
        })
      );
    };

    const projectTrend = await getTrend("project", isAdmin ? {} : { userId });
    const taskTrend = await getTrend(
      "task",
      isAdmin ? {} : { assigneeId: userId }
    );
    const userTrend = [1, 2, 2, 3, 3, 4, totalUsersCount]; // Simple mock trend for users
    const deadlineTrend = [0, 1, 1, 2, 2, 3, upcomingDeadlinesCount]; // Simple mock trend for deadlines

    return NextResponse.json({
      success: true,
      data: {
        totalProjects: {
          current: activeProjectsCount,
          total: totalProjectsCount,
          trend: projectTrend,
        },
        completedTasks: {
          current: completedTasksCount,
          total: totalTasksCount,
          trend: taskTrend,
        },
        activeUsers: {
          current: Math.max(activeUsersCount, 1), // At least current user
          total: totalUsersCount,
          trend: userTrend,
        },
        upcomingDeadlines: {
          current: upcomingDeadlinesCount,
          total: projectsWithDeadlinesCount,
          trend: deadlineTrend,
        },
      },
    });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch dashboard stats");
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
