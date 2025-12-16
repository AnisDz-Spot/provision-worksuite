import prisma from "@/lib/prisma";
import { isValidEmail, isValidUUID, sanitizeString } from "../validation";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// User type - matches new schema (removed legacy HR/financial fields)
export type User = {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: string;
  roleId?: string;
  passwordHash?: string;
  phone?: string;
  bio?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Project type - updated with new fields, removed owner/progress
export type Project = {
  id: number;
  uid: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  deadline?: string;
  budget?: number;
  priority?: string;
  userId: number;
  // New fields
  completedAt?: string;
  clientName?: string;
  tags: string[];
  visibility: string;
  archivedAt?: string;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Task type - updated with new fields
export type Task = {
  id: number;
  uid: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due?: string;
  estimateHours?: number;
  loggedHours?: number;
  // New fields
  assigneeId?: number;
  labels: string[];
  boardColumn: string;
  order: number;
  parentTaskId?: string;
  attachments?: Record<string, unknown>;
  completedAt?: string;
  startedAt?: string;
  blockedBy?: string;
  watchers: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

// ProjectMember type
export type ProjectMember = {
  id: string;
  projectId: number;
  userId: number;
  role: string; // owner, admin, member, viewer
  joinedAt: Date;
};

// Milestone type
export type Milestone = {
  id: string;
  projectId: number;
  name: string;
  description?: string;
  dueDate?: string;
  status: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
};

// Comment type (with threading)
export type Comment = {
  id: string;
  content: string;
  taskId?: string;
  projectId?: number;
  userId: number;
  parentCommentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Notification type
export type Notification = {
  id: string;
  userId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt?: Date;
};

// Activity type
export type Activity = {
  id: string;
  userId: number;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

// File type
export type FileRecord = {
  id: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  projectId?: number;
  taskId?: string;
  uploadedBy: number;
  createdAt?: Date;
};

// CalendarEvent type
export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees: string[];
  projectId?: number;
  taskId?: string;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
};

// TimeLog type
export type TimeLog = {
  id: number;
  taskId: string;
  projectId: string;
  hours: number;
  note?: string;
  loggedBy: string;
  loggedAt: Date;
};

// =============================================================================
// USER OPERATIONS
// =============================================================================

export async function createUser(
  user: Omit<User, "id" | "uid" | "createdAt" | "updatedAt">
) {
  if (!isValidEmail(user.email)) {
    throw new Error("Invalid email format");
  }

  const sanitizedName = sanitizeString(user.name, 100);
  const sanitizedEmail = sanitizeString(user.email, 255);

  const newUser = await prisma.user.create({
    data: {
      email: sanitizedEmail,
      name: sanitizedName,
      avatarUrl: user.avatarUrl,
      role: user.role || "member",
      roleId: user.roleId,
      passwordHash: user.passwordHash,
      phone: user.phone,
      bio: user.bio,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
    },
  });

  return newUser;
}

export async function updateUser(uid: string, updates: Partial<User>) {
  const { passwordHash, ...safeUpdates } = updates;

  if (safeUpdates.email && !isValidEmail(safeUpdates.email)) {
    throw new Error("Invalid email format");
  }

  const data: Record<string, unknown> = {};

  if (safeUpdates.email) data.email = sanitizeString(safeUpdates.email, 255);
  if (safeUpdates.name) data.name = sanitizeString(safeUpdates.name, 100);
  if (safeUpdates.avatarUrl !== undefined)
    data.avatarUrl = safeUpdates.avatarUrl;
  if (safeUpdates.role !== undefined) data.role = safeUpdates.role;
  if (safeUpdates.roleId !== undefined) data.roleId = safeUpdates.roleId;
  if (safeUpdates.phone !== undefined) data.phone = safeUpdates.phone;
  if (safeUpdates.bio !== undefined) data.bio = safeUpdates.bio;
  if (safeUpdates.addressLine1 !== undefined)
    data.addressLine1 = safeUpdates.addressLine1;
  if (safeUpdates.addressLine2 !== undefined)
    data.addressLine2 = safeUpdates.addressLine2;
  if (safeUpdates.city !== undefined) data.city = safeUpdates.city;
  if (safeUpdates.state !== undefined) data.state = safeUpdates.state;
  if (safeUpdates.country !== undefined) data.country = safeUpdates.country;
  if (safeUpdates.postalCode !== undefined)
    data.postalCode = safeUpdates.postalCode;

  const updatedUser = await prisma.user.update({
    where: { uid },
    data,
  });

  return updatedUser;
}

export async function getUserById(uid: string) {
  return await prisma.user.findUnique({
    where: { uid },
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function deleteUser(uid: string) {
  await prisma.user.delete({
    where: { uid },
  });
}

// =============================================================================
// PROJECT OPERATIONS
// =============================================================================

export async function createProject(
  project: Omit<Project, "id" | "uid" | "createdAt" | "updatedAt">
) {
  const newProject = await prisma.project.create({
    data: {
      name: project.name,
      description: project.description,
      status: project.status || "active",
      startDate: project.startDate ? new Date(project.startDate) : null,
      deadline: project.deadline ? new Date(project.deadline) : null,
      budget: project.budget,
      priority: project.priority,
      userId: project.userId,
      completedAt: project.completedAt ? new Date(project.completedAt) : null,
      clientName: project.clientName,
      tags: project.tags || [],
      visibility: project.visibility || "private",
      archivedAt: project.archivedAt ? new Date(project.archivedAt) : null,
      color: project.color,
    },
  });

  return newProject;
}

export async function getProjectById(uid: string) {
  return await prisma.project.findUnique({
    where: { uid },
    include: {
      members: true,
      milestones: true,
    },
  });
}

export async function getAllProjects(userId?: number) {
  if (userId) {
    return await prisma.project.findMany({
      where: {
        OR: [{ userId }, { members: { some: { userId } } }],
        archivedAt: null,
      },
      orderBy: { updatedAt: "desc" },
    });
  }
  return await prisma.project.findMany({
    where: { archivedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateProject(uid: string, updates: Partial<Project>) {
  const data: Record<string, unknown> = {};

  if (updates.name) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status) data.status = updates.status;
  if (updates.priority !== undefined) data.priority = updates.priority;
  if (updates.startDate !== undefined)
    data.startDate = updates.startDate ? new Date(updates.startDate) : null;
  if (updates.deadline !== undefined)
    data.deadline = updates.deadline ? new Date(updates.deadline) : null;
  if (updates.budget !== undefined) data.budget = updates.budget;
  if (updates.completedAt !== undefined)
    data.completedAt = updates.completedAt
      ? new Date(updates.completedAt)
      : null;
  if (updates.clientName !== undefined) data.clientName = updates.clientName;
  if (updates.tags !== undefined) data.tags = updates.tags;
  if (updates.visibility !== undefined) data.visibility = updates.visibility;
  if (updates.archivedAt !== undefined)
    data.archivedAt = updates.archivedAt ? new Date(updates.archivedAt) : null;
  if (updates.color !== undefined) data.color = updates.color;

  return await prisma.project.update({
    where: { uid },
    data,
  });
}

export async function deleteProject(uid: string) {
  await prisma.project.delete({
    where: { uid },
  });
}

export async function archiveProject(uid: string) {
  return await prisma.project.update({
    where: { uid },
    data: { archivedAt: new Date() },
  });
}

// =============================================================================
// PROJECT MEMBER OPERATIONS
// =============================================================================

export async function addProjectMember(
  projectId: number,
  userId: number,
  role: string = "member"
) {
  return await prisma.projectMember.create({
    data: {
      projectId,
      userId,
      role,
    },
  });
}

export async function removeProjectMember(projectId: number, userId: number) {
  return await prisma.projectMember.delete({
    where: {
      projectId_userId: { projectId, userId },
    },
  });
}

export async function getProjectMembers(projectId: number) {
  return await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  });
}

export async function updateProjectMemberRole(
  projectId: number,
  userId: number,
  role: string
) {
  return await prisma.projectMember.update({
    where: {
      projectId_userId: { projectId, userId },
    },
    data: { role },
  });
}

// =============================================================================
// MILESTONE OPERATIONS
// =============================================================================

export async function createMilestone(
  milestone: Omit<Milestone, "id" | "createdAt" | "updatedAt">
) {
  return await prisma.milestone.create({
    data: {
      projectId: milestone.projectId,
      name: milestone.name,
      description: milestone.description,
      dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
      status: milestone.status || "pending",
      order: milestone.order || 0,
    },
  });
}

export async function getMilestonesByProject(projectId: number) {
  return await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
}

export async function updateMilestone(id: string, updates: Partial<Milestone>) {
  const data: Record<string, unknown> = {};

  if (updates.name) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.dueDate !== undefined)
    data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.order !== undefined) data.order = updates.order;

  return await prisma.milestone.update({
    where: { id },
    data,
  });
}

export async function deleteMilestone(id: string) {
  await prisma.milestone.delete({
    where: { id },
  });
}

// =============================================================================
// TASK OPERATIONS
// =============================================================================

export async function createTask(
  task: Omit<Task, "id" | "uid" | "createdAt" | "updatedAt">
) {
  return await prisma.task.create({
    data: {
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status || "todo",
      priority: task.priority || "medium",
      due: task.due ? new Date(task.due) : null,
      estimateHours: task.estimateHours,
      loggedHours: task.loggedHours || 0,
      assigneeId: task.assigneeId,
      labels: task.labels || [],
      boardColumn: task.boardColumn || "todo",
      order: task.order || 0,
      parentTaskId: task.parentTaskId,
      attachments: task.attachments,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      startedAt: task.startedAt ? new Date(task.startedAt) : null,
      blockedBy: task.blockedBy,
      watchers: task.watchers || [],
    },
  });
}

export async function getTasksByProject(projectId: string) {
  return await prisma.task.findMany({
    where: { projectId },
    include: { assignee: true },
    orderBy: [{ boardColumn: "asc" }, { order: "asc" }],
  });
}

export async function getAllTasks() {
  return await prisma.task.findMany({
    include: { assignee: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskByUid(uid: string) {
  return await prisma.task.findUnique({
    where: { uid },
    include: {
      assignee: true,
      subtasks: true,
      comments: true,
      files: true,
    },
  });
}

export async function updateTask(uid: string, updates: Partial<Task>) {
  const data: Record<string, unknown> = {};

  if (updates.title) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status) data.status = updates.status;
  if (updates.priority) data.priority = updates.priority;
  if (updates.due !== undefined)
    data.due = updates.due ? new Date(updates.due) : null;
  if (updates.estimateHours !== undefined)
    data.estimateHours = updates.estimateHours;
  if (updates.loggedHours !== undefined) data.loggedHours = updates.loggedHours;
  if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId;
  if (updates.labels !== undefined) data.labels = updates.labels;
  if (updates.boardColumn !== undefined) data.boardColumn = updates.boardColumn;
  if (updates.order !== undefined) data.order = updates.order;
  if (updates.parentTaskId !== undefined)
    data.parentTaskId = updates.parentTaskId;
  if (updates.attachments !== undefined) data.attachments = updates.attachments;
  if (updates.completedAt !== undefined)
    data.completedAt = updates.completedAt
      ? new Date(updates.completedAt)
      : null;
  if (updates.startedAt !== undefined)
    data.startedAt = updates.startedAt ? new Date(updates.startedAt) : null;
  if (updates.blockedBy !== undefined) data.blockedBy = updates.blockedBy;
  if (updates.watchers !== undefined) data.watchers = updates.watchers;

  return await prisma.task.update({
    where: { uid },
    data,
  });
}

export async function deleteTask(uid: string) {
  await prisma.task.delete({
    where: { uid },
  });
}

export async function reorderTasks(
  taskOrders: { uid: string; order: number; boardColumn?: string }[]
) {
  const updates = taskOrders.map((t) =>
    prisma.task.update({
      where: { uid: t.uid },
      data: { order: t.order, boardColumn: t.boardColumn },
    })
  );
  return await prisma.$transaction(updates);
}

// =============================================================================
// COMMENT OPERATIONS
// =============================================================================

export async function createComment(
  comment: Omit<Comment, "id" | "createdAt" | "updatedAt">
) {
  return await prisma.comment.create({
    data: {
      content: comment.content,
      taskId: comment.taskId,
      projectId: comment.projectId,
      userId: comment.userId,
      parentCommentId: comment.parentCommentId,
    },
  });
}

export async function getCommentsByTask(taskId: string) {
  return await prisma.comment.findMany({
    where: { taskId, parentCommentId: null },
    include: {
      user: true,
      replies: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getCommentsByProject(projectId: number) {
  return await prisma.comment.findMany({
    where: { projectId, parentCommentId: null },
    include: {
      user: true,
      replies: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateComment(id: string, content: string) {
  return await prisma.comment.update({
    where: { id },
    data: { content },
  });
}

export async function deleteComment(id: string) {
  await prisma.comment.delete({
    where: { id },
  });
}

// =============================================================================
// NOTIFICATION OPERATIONS
// =============================================================================

export async function createNotification(
  notification: Omit<Notification, "id" | "createdAt">
) {
  return await prisma.notification.create({
    data: {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      isRead: notification.isRead || false,
    },
  });
}

export async function getNotificationsByUser(
  userId: number,
  unreadOnly = false
) {
  return await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationAsRead(id: string) {
  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsAsRead(userId: number) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotification(id: string) {
  await prisma.notification.delete({
    where: { id },
  });
}

// =============================================================================
// ACTIVITY OPERATIONS
// =============================================================================

export async function createActivity(
  activity: Omit<Activity, "id" | "createdAt">
) {
  return await prisma.activity.create({
    data: {
      userId: activity.userId,
      entityType: activity.entityType,
      entityId: activity.entityId,
      action: activity.action,
      metadata: activity.metadata,
    },
  });
}

export async function getActivitiesByEntity(
  entityType: string,
  entityId: string
) {
  return await prisma.activity.findMany({
    where: { entityType, entityId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getRecentActivities(limit = 50) {
  return await prisma.activity.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

export async function createFile(file: Omit<FileRecord, "id" | "createdAt">) {
  return await prisma.file.create({
    data: {
      filename: file.filename,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      projectId: file.projectId,
      taskId: file.taskId,
      uploadedBy: file.uploadedBy,
    },
  });
}

export async function getFilesByProject(projectId: number) {
  return await prisma.file.findMany({
    where: { projectId },
    include: { uploader: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFilesByTask(taskId: string) {
  return await prisma.file.findMany({
    where: { taskId },
    include: { uploader: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteFile(id: string) {
  await prisma.file.delete({
    where: { id },
  });
}

// =============================================================================
// CALENDAR EVENT OPERATIONS
// =============================================================================

export async function createCalendarEvent(
  event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">
) {
  return await prisma.calendarEvent.create({
    data: {
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      attendees: event.attendees || [],
      projectId: event.projectId,
      taskId: event.taskId,
      createdById: event.createdById,
    },
  });
}

export async function getCalendarEventsByDateRange(
  startDate: Date,
  endDate: Date,
  userId?: number
) {
  const where: Record<string, unknown> = {
    startTime: { gte: startDate },
    endTime: { lte: endDate },
  };

  if (userId) {
    where.OR = [
      { createdById: userId },
      { attendees: { has: userId.toString() } },
    ];
  }

  return await prisma.calendarEvent.findMany({
    where,
    include: { project: true, task: true, createdBy: true },
    orderBy: { startTime: "asc" },
  });
}

export async function updateCalendarEvent(
  id: string,
  updates: Partial<CalendarEvent>
) {
  const data: Record<string, unknown> = {};

  if (updates.title) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.startTime) data.startTime = updates.startTime;
  if (updates.endTime) data.endTime = updates.endTime;
  if (updates.location !== undefined) data.location = updates.location;
  if (updates.attendees !== undefined) data.attendees = updates.attendees;
  if (updates.projectId !== undefined) data.projectId = updates.projectId;
  if (updates.taskId !== undefined) data.taskId = updates.taskId;

  return await prisma.calendarEvent.update({
    where: { id },
    data,
  });
}

export async function deleteCalendarEvent(id: string) {
  await prisma.calendarEvent.delete({
    where: { id },
  });
}

// =============================================================================
// TIME LOG OPERATIONS
// =============================================================================

export async function addTimeLog(timeLog: Omit<TimeLog, "id" | "loggedAt">) {
  return await prisma.timeLog.create({
    data: {
      taskId: timeLog.taskId,
      projectId: timeLog.projectId,
      hours: timeLog.hours,
      note: timeLog.note,
      loggedBy: timeLog.loggedBy,
    },
  });
}

export async function getTimeLogsByTask(taskId: string) {
  return await prisma.timeLog.findMany({
    where: { taskId },
    orderBy: { loggedAt: "desc" },
  });
}

export async function getTimeLogsByProject(projectId: string) {
  return await prisma.timeLog.findMany({
    where: { projectId },
    orderBy: { loggedAt: "desc" },
  });
}

// =============================================================================
// HELPER: Calculate Project Progress
// =============================================================================

export async function calculateProjectProgress(
  projectId: string
): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { status: true },
  });

  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(
    (t: { status: string }) => t.status === "done" || t.status === "completed"
  ).length;

  return Math.round((completedTasks / tasks.length) * 100);
}
