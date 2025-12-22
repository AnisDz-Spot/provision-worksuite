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

    // 1. Project Status Distribution
    const projectStatusCounts = await prisma.project.groupBy({
      by: ["status"],
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [
              { userId: userUidInt },
              { members: { some: { userId: userUidInt } } },
            ],
            archivedAt: null,
          },
      _count: true,
    });

    // 2. Project Health (Top 12)
    const projectsRaw = await prisma.project.findMany({
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [
              { userId: userUidInt },
              { members: { some: { userId: userUidInt } } },
            ],
            archivedAt: null,
          },
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          select: { status: true },
        },
      },
    });

    const projectHealthData = projectsRaw.map((p: any) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(
        (t: any) => t.status === "done" || t.status === "completed"
      ).length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      let health = progress;
      if (p.deadline && new Date(p.deadline) < new Date() && progress < 100) {
        health = Math.max(0, progress - 20);
      }

      return { name: p.name, health, progress };
    });

    // 3. Tasks by Priority
    const taskPriorityCounts = await prisma.task.groupBy({
      by: ["priority"],
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

    // 4. Team Metrics
    const totalUsers = await prisma.user.count();
    const taskStatusCounts = await prisma.task.groupBy({
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

    const totalTasks = taskStatusCounts.reduce(
      (acc: number, cur: any) => acc + cur._count,
      0
    );
    const completedTasksTotal = taskStatusCounts
      .filter((s: any) => s.status === "done" || s.status === "completed")
      .reduce((acc: number, s: any) => acc + s._count, 0);

    // 5. Weekly Task Completion Trend (Last 7 Days)
    const completionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);

      const dayTasks = await prisma.task.findMany({
        where: {
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { project: { userId: userUidInt } },
                  { project: { members: { some: { userId: userUidInt } } } },
                  { assigneeId: userUidInt },
                ],
              }),
          createdAt: { gte: start, lt: end },
        },
        select: { status: true },
      });

      const completed = dayTasks.filter(
        (t: any) => t.status === "done" || t.status === "completed"
      ).length;
      const pending = dayTasks.length - completed;

      completionTrend.push({
        date: start.toLocaleDateString(undefined, { weekday: "short" }),
        completed,
        pending,
        overdue: 0, // Simplified for now
      });
    }

    const utilization =
      totalTasks > 0 ? Math.round((completedTasksTotal / totalTasks) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        projectStatus: projectStatusCounts,
        projectHealth: projectHealthData,
        taskPriority: taskPriorityCounts,
        teamMetrics: {
          activeMembers: totalUsers,
          utilization,
        },
        completionTrend,
      },
    });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch chart analytics");
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
