import prisma from "@/lib/prisma";

/**
 * Authorization helper to check if a user can access a project
 */
export async function canAccessProject(
  userId: number,
  projectId: number,
  userRole: string
): Promise<boolean> {
  // Admins can access all projects
  if (
    [
      "admin",
      "global-admin",
      "master-admin",
      "Administrator",
      "Master Admin",
    ].includes(userRole)
  ) {
    return true;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      userId: true,
      visibility: true,
      members: {
        where: { userId },
        select: { id: true },
      },
    },
  });

  if (!project) return false;

  // Owner can access
  if (project.userId === userId) return true;

  // Member can access
  if (project.members.length > 0) return true;

  // Public projects are accessible to all authenticated users
  if (project.visibility === "public") return true;

  return false;
}

/**
 * Authorization helper to check if a user can modify a project
 */
export async function canModifyProject(
  userId: number,
  projectId: number,
  userRole: string
): Promise<boolean> {
  // Admins can modify all projects
  if (
    [
      "admin",
      "global-admin",
      "master-admin",
      "Administrator",
      "Master Admin",
    ].includes(userRole)
  ) {
    return true;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      userId: true,
      members: {
        where: { userId, role: { in: ["owner", "admin"] } },
        select: { id: true },
      },
    },
  });

  if (!project) return false;

  // Owner can modify
  if (project.userId === userId) return true;

  // Project admin can modify
  if (project.members.length > 0) return true;

  return false;
}

/**
 * Authorization helper to check if a user can log time for a task
 */
export async function canLogTimeForTask(
  userId: number,
  taskId: string,
  userRole: string
): Promise<{ authorized: boolean; task?: any; reason?: string }> {
  // Admins can log time for any task
  if (
    [
      "admin",
      "global-admin",
      "master-admin",
      "Administrator",
      "Master Admin",
    ].includes(userRole)
  ) {
    const task = await prisma.task.findUnique({
      where: { uid: taskId },
      select: { id: true, title: true, projectUid: true },
    });

    if (!task) {
      return { authorized: false, reason: "Task not found" };
    }

    return { authorized: true, task };
  }

  // Find task and check assignment
  const task = await prisma.task.findUnique({
    where: { uid: taskId },
    select: {
      id: true,
      title: true,
      projectUid: true,
      assigneeId: true,
      project: {
        select: {
          id: true,
          userId: true,
          members: {
            where: { userId },
            select: { id: true, role: true },
          },
        },
      },
    },
  });

  if (!task) {
    return { authorized: false, reason: "Task not found" };
  }

  // User must be assigned to the task
  if (task.assigneeId !== userId) {
    return {
      authorized: false,
      reason: "You can only log time for tasks assigned to you",
    };
  }

  // User must have access to the project
  const isProjectOwner = task.project?.userId === userId;
  const isProjectMember =
    task.project?.members && task.project.members.length > 0;

  if (!isProjectOwner && !isProjectMember) {
    return {
      authorized: false,
      reason: "You do not have access to this project",
    };
  }

  return { authorized: true, task };
}

/**
 * Get projects accessible by a user
 */
export async function getAccessibleProjects(
  userId: number,
  userRole: string,
  filters?: {
    status?: string;
    visibility?: string;
    clientId?: string;
  }
) {
  const isAdmin = [
    "admin",
    "global-admin",
    "master-admin",
    "Administrator",
    "Master Admin",
  ].includes(userRole);

  const whereClause: any = {
    archivedAt: null,
  };

  // Apply filters
  if (filters?.status && filters.status !== "all") {
    whereClause.status = filters.status;
  }

  if (filters?.visibility && filters.visibility !== "all") {
    whereClause.visibility = filters.visibility;
  }

  if (filters?.clientId) {
    whereClause.clientId = filters.clientId;
  }

  // Non-admins see only their projects
  if (!isAdmin) {
    whereClause.OR = [
      { userId },
      { members: { some: { userId } } },
      { visibility: { in: ["public", "team-only"] } },
    ];
  }

  return prisma.project.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          uid: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              uid: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          milestones: true,
          files: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
