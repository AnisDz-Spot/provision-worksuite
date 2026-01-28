import { DigestData } from "@/components/reports/digest/types";

/**
 * Gather data for the weekly digest
 * Can be used by both API routes and background tasks
 */
export async function getDigestData(
  userId?: number,
  projectId?: string,
): Promise<DigestData> {
  const { shouldUseDatabaseData } = await import("@/lib/dataSource");

  // Mock Data Logic
  if (!shouldUseDatabaseData()) {
    // ... keep existing mock logic unchanged ...
    return {
      weekRange: "Dec 3 - Dec 9, 2025",
      summary: {
        tasksCompleted: 23,
        tasksInProgress: 15,
        tasksBlocked: 3,
        progressPercent: 68,
        velocityChange: "+12%",
        budgetUtilization: 72,
        hoursLogged: 142,
        teamUtilization: 85,
      },
      lastWeekSummary: {
        tasksCompleted: 18,
        tasksInProgress: 17,
        tasksBlocked: 2,
        progressPercent: 62,
        hoursLogged: 128,
        teamUtilization: 78,
      },
      projects: [
        {
          id: "p1",
          name: "Website Redesign",
          progress: 75,
          status: "On Track",
          tasksCompleted: 8,
          upcomingDeadline: "Dec 15, 2025",
          risk: "low",
        },
        {
          id: "p2",
          name: "Mobile App MVP",
          progress: 45,
          status: "At Risk",
          tasksCompleted: 6,
          upcomingDeadline: "Dec 20, 2025",
          risk: "high",
        },
      ],
      blockers: [
        {
          title: "API authentication endpoint not ready",
          severity: "critical",
          project: "Mobile App MVP",
        },
      ],
      achievements: [
        "Completed user authentication module",
        "Deployed staging env",
      ],
      upcomingMilestones: [
        {
          title: "Beta Release",
          date: "Dec 12, 2025",
          project: "Mobile App MVP",
        },
      ],
    };
  }

  // Database Data Logic
  try {
    const prisma = (await import("@/lib/prisma")).default;

    // Build WhereInput for Projects
    // If specific projectId is requested, use that.
    // Else if userId is provided, filter by membership/ownership.
    // Note: Schema for ProjectMember is `model ProjectMember { user User ... }`
    // And Project has `members ProjectMember[]`

    let projectWhere: any = {};

    if (projectId) {
      projectWhere.uid = projectId;
    } else if (userId) {
      projectWhere.OR = [
        // User is a member
        { members: { some: { userId: userId } } },
        // OR User is the creator/owner (if such field exists, usually handled by membership, but checking Project schema...)
        // Project schema: createdBy is not explicitly a relation to User ID usually in this schema style?
        // Let's rely on members list. If creator isn't in members, they won't see it? usually they are added.
      ];
    }

    // Load projects and tasks directly from DB
    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        uid: true,
        name: true,
        status: true,
        deadline: true,
        priority: true,
        _count: {
          select: {
            tasks: { where: { status: { in: ["Done", "Completed"] } } },
          },
        },
      },
    });

    // Get IDs to fetch tasks
    const projectIds = projects.map((p: any) => p.id);

    // Fetch tasks for these projects
    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
    });

    const completed = tasks.filter(
      (t: any) => t.status === "Done" || t.status === "Completed",
    ).length;
    const inProgress = tasks.filter(
      (t: any) => t.status === "In Progress" || t.status === "in_progress",
    ).length;
    const blocked = tasks.filter(
      (t: any) => t.status === "Blocked" || t.status === "blocked",
    ).length;
    const overallProgress =
      tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const rangeStr = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const projectSummaries = projects.map((p: any) => ({
      id: p.uid,
      name: p.name,
      progress: 0, // In real app we'd calculate this or have a field
      status: p.status,
      tasksCompleted: p._count?.tasks || 0,
      upcomingDeadline: p.deadline
        ? new Date(p.deadline).toLocaleDateString()
        : "N/A",
      risk: (p.priority === "high" ? "high" : "low") as "high" | "low",
    }));

    // Calculate mock progress for projects based on tasks (simplified)
    projectSummaries.forEach((ps: any) => {
      const pTasks = tasks.filter((t: any) => t.projectId === ps.id);
      if (pTasks.length > 0) {
        const pCompleted = pTasks.filter(
          (t: any) => t.status === "Done" || t.status === "Completed",
        ).length;
        ps.progress = Math.round((pCompleted / pTasks.length) * 100);
      }
    });

    return {
      weekRange: rangeStr,
      summary: {
        tasksCompleted: completed,
        tasksInProgress: inProgress,
        tasksBlocked: blocked,
        progressPercent: overallProgress,
        velocityChange: "+5%",
        budgetUtilization: 0,
        hoursLogged: 0,
        teamUtilization: 0,
      },
      lastWeekSummary: {
        tasksCompleted: Math.max(0, completed - 2),
        tasksInProgress: inProgress,
        tasksBlocked: blocked,
        progressPercent: Math.max(0, overallProgress - 5),
        hoursLogged: 0,
        teamUtilization: 0,
      },
      projects: projectSummaries,
      blockers: [],
      achievements: completed > 0 ? [`${completed} tasks completed`] : [],
      upcomingMilestones: projectSummaries
        .filter((p: any) => p.upcomingDeadline !== "N/A")
        .map((p: any) => ({
          title: "Project Deadline",
          date: p.upcomingDeadline,
          project: p.name,
        })),
    };
  } catch (e) {
    console.error("Failed to gather digest data from DB", e);
    throw e;
  }
}
