import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const isAdmin = user.role === "admin" || user.role === "global-admin";
    const userUidInt = parseInt(user.uid) || 0;

    // 1. Projects Count
    const totalProjects = await prisma.project.count({
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [
              { userId: userUidInt },
              { members: { some: { userId: userUidInt } } },
            ],
            archivedAt: null,
          },
    });

    // 2. Tasks Count (Completed vs Pending)
    const taskStats = await prisma.task.groupBy({
      by: ["status"],
      where: isAdmin
        ? {}
        : {
            OR: [
              { project: { userId: userUidInt } },
              { project: { members: { some: { userId: userUidInt } } } },
              { assigneeId: userUidInt },
            ],
          },
      _count: true,
    });

    const completedTasks = taskStats
      .filter((s: any) => s.status === "done" || s.status === "completed")
      .reduce((acc: number, s: any) => acc + s._count, 0);

    // 3. Active Users (Total in system)
    const activeUsers = await prisma.user.count();

    // 4. Upcoming Deadlines (Next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingDeadlines = await prisma.project.count({
      where: {
        ...(isAdmin
          ? {}
          : {
              OR: [
                { userId: userUidInt },
                { members: { some: { userId: userUidInt } } },
              ],
            }),
        archivedAt: null,
        deadline: {
          gt: new Date(),
          lte: nextWeek,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        completedTasks,
        activeUsers,
        upcomingDeadlines,
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
