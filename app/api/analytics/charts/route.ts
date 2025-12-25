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
    // Fetch full user from DB to get the Integer ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ success: true, data: {} });
    }

    const isAdmin = dbUser.role === "admin" || dbUser.role === "global-admin";
    const userId = dbUser.id;

    // 1. Project Status Distribution
    const projectStatusCounts = await prisma.project.groupBy({
      by: ["status"],
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [{ userId: userId }, { members: { some: { userId: userId } } }],
            archivedAt: null,
          },
      _count: true,
    });

    // 2. Project Health (Top 12)
    const projectsRaw = await prisma.project.findMany({
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [{ userId: userId }, { members: { some: { userId: userId } } }],
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
              { project: { userId: userId } },
              { project: { members: { some: { userId: userId } } } },
              { assigneeId: userId },
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
              { project: { userId: userId } },
              { project: { members: { some: { userId: userId } } } },
              { assigneeId: userId },
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
                  { project: { userId: userId } },
                  { project: { members: { some: { userId: userId } } } },
                  { assigneeId: userId },
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

    // 6. Team Productivity (Last 6 Weeks)
    const productivityData = [];
    const now = new Date();
    const prodStart = new Date();
    prodStart.setDate(prodStart.getDate() - 42); // 6 weeks ago

    // Fetch details for filtering purposes first
    // Actually, we can just fetch all completed tasks in this range and process in JS
    const recentCompletedTasks = await prisma.task.findMany({
      where: {
        status: { in: ["done", "completed"] },
        updatedAt: { gte: prodStart },
        assigneeId: { not: null },
        // Apply same visibility filters if needed, but for productivity chart usually we show team
        ...(isAdmin
          ? {}
          : {
              project: {
                OR: [
                  { userId: userId },
                  { members: { some: { userId: userId } } },
                ],
              },
            }),
      },
      select: {
        updatedAt: true,
        assignee: {
          select: { name: true },
        },
      },
    });

    // Bucket by week
    const weeksMap = new Map<string, any>();

    // Initialize weeks
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      // keys like "Wk 10/24"
      const weekLabel = `Wk ${d.getMonth() + 1}/${d.getDate()}`;
      // Store start/end for comparison
      const weekStart = new Date(d);
      weekStart.setHours(0, 0, 0, 0);
      // Approximation: a week is 7 days window ending on that day?
      // Or standard weeks. Let's use simple 7-day windows back from now.
      // Actually the previous loop generated specific days.
      // Let's re-use the loop structure for consistent labels.
      weeksMap.set(weekLabel, { week: weekLabel });
    }

    // Process tasks
    recentCompletedTasks.forEach((task: any) => {
      if (!task.assignee?.name) return;
      const name = task.assignee.name.split(" ")[0]; // First name
      const taskDate = new Date(task.updatedAt);

      // Find which week bucket it belongs to (simplest: closest week label)
      // Or just map to "Wk M/D" format
      const label = `Wk ${taskDate.getMonth() + 1}/${taskDate.getDate()}`;
      // This won't match exactly because dates differ.

      // Better approach: Bucket by week number or date range
    });

    // Let's redo simple bucketing
    // Create 6 buckets based on date ranges
    const buckets: {
      start: Date;
      end: Date;
      label: string;
      counts: Record<string, number>;
    }[] = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);

      buckets.push({
        start,
        end,
        label: `Wk ${end.getMonth() + 1}/${end.getDate()}`,
        counts: {},
      });
    }

    recentCompletedTasks.forEach((task: any) => {
      if (!task.assignee?.name) return;
      const tDate = new Date(task.updatedAt);
      const bucket = buckets.find((b) => tDate >= b.start && tDate <= b.end);
      if (bucket) {
        const name = task.assignee.name.split(" ")[0];
        bucket.counts[name] = (bucket.counts[name] || 0) + 1;
      }
    });

    const teamProductivity = buckets.map((b) => ({
      week: b.label,
      ...b.counts,
    }));

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
        teamProductivity,
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
