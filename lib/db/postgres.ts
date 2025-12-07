import prisma from "@/lib/prisma";
import { isValidEmail, isValidUUID, sanitizeString } from "../validation";
import { Prisma } from "@prisma/client";

// Re-export types from Prisma or define compatible ones if needed
// For now, we keep manual types to avoid breaking UI components that rely on them
// But ideally, we should infer from Prisma.

export type User = {
  userId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string; // Prisma returns null, mapped to undefined/null
  isActive: boolean;
  systemRole: string;
  jobTitle?: string;
  department?: string;
  timezone: string;
  themePreference?: string;
  phoneNumber?: string;
  slackHandle?: string;
  hourlyCostRate: number;
  hourlyBillableRate: number;
  isBillable: boolean;
  employmentType: string;
  defaultWorkingHoursPerDay: number;
  hireDate?: string; // string for API, Date from Prisma
  terminationDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Helper: Prisma types match mostly, but decimals need handling if they come as Decimal.js objects
// Using 'any' for result casting briefly to match legacy return types if needed,
// or better: let's map properly.

export async function createUser(
  user: Omit<User, "userId" | "createdAt" | "updatedAt">
) {
  // Validate email format
  if (!isValidEmail(user.email)) {
    throw new Error("Invalid email format");
  }

  // Sanitize string inputs
  const sanitizedFullName = sanitizeString(user.fullName, 100);
  const sanitizedEmail = sanitizeString(user.email, 255);

  const newUser = await prisma.user.create({
    data: {
      email: sanitizedEmail,
      passwordHash: user.passwordHash,
      fullName: sanitizedFullName,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      systemRole: user.systemRole,
      jobTitle: user.jobTitle,
      department: user.department,
      timezone: user.timezone,
      themePreference: user.themePreference || "light",
      phoneNumber: user.phoneNumber,
      slackHandle: user.slackHandle,
      hourlyCostRate: new Prisma.Decimal(user.hourlyCostRate),
      hourlyBillableRate: new Prisma.Decimal(user.hourlyBillableRate),
      isBillable: user.isBillable,
      employmentType: user.employmentType,
      defaultWorkingHoursPerDay: new Prisma.Decimal(
        user.defaultWorkingHoursPerDay
      ),
      hireDate: user.hireDate ? new Date(user.hireDate) : null,
      terminationDate: user.terminationDate
        ? new Date(user.terminationDate)
        : null,
    },
  });

  return newUser;
}

export async function updateUser(userId: string, updates: Partial<User>) {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

  // NEVER allow direct password hash updates
  const { passwordHash, ...safeUpdates } = updates;

  // Validate email if being updated
  if (safeUpdates.email && !isValidEmail(safeUpdates.email)) {
    throw new Error("Invalid email format");
  }

  // Whitelist filtering is less critical with Prisma types but good for safety
  // We can construct the update object dynamically

  const data: Prisma.UserUpdateInput = {};

  if (safeUpdates.email) data.email = sanitizeString(safeUpdates.email, 255);
  if (safeUpdates.fullName)
    data.fullName = sanitizeString(safeUpdates.fullName, 100);
  if (safeUpdates.avatarUrl !== undefined)
    data.avatarUrl = safeUpdates.avatarUrl;
  if (safeUpdates.isActive !== undefined) data.isActive = safeUpdates.isActive;
  if (safeUpdates.systemRole !== undefined)
    data.systemRole = safeUpdates.systemRole;
  if (safeUpdates.jobTitle !== undefined) data.jobTitle = safeUpdates.jobTitle;
  if (safeUpdates.department !== undefined)
    data.department = safeUpdates.department;
  if (safeUpdates.timezone !== undefined) data.timezone = safeUpdates.timezone;
  if (safeUpdates.themePreference !== undefined)
    data.themePreference = safeUpdates.themePreference;
  if (safeUpdates.phoneNumber !== undefined)
    data.phoneNumber = safeUpdates.phoneNumber;
  if (safeUpdates.slackHandle !== undefined)
    data.slackHandle = safeUpdates.slackHandle;
  if (safeUpdates.hourlyCostRate !== undefined)
    data.hourlyCostRate = new Prisma.Decimal(safeUpdates.hourlyCostRate);
  if (safeUpdates.hourlyBillableRate !== undefined)
    data.hourlyBillableRate = new Prisma.Decimal(
      safeUpdates.hourlyBillableRate
    );
  if (safeUpdates.isBillable !== undefined)
    data.isBillable = safeUpdates.isBillable;
  if (safeUpdates.employmentType !== undefined)
    data.employmentType = safeUpdates.employmentType;
  if (safeUpdates.defaultWorkingHoursPerDay !== undefined)
    data.defaultWorkingHoursPerDay = new Prisma.Decimal(
      safeUpdates.defaultWorkingHoursPerDay
    );
  if (safeUpdates.hireDate !== undefined)
    data.hireDate = safeUpdates.hireDate
      ? new Date(safeUpdates.hireDate)
      : null;
  if (safeUpdates.terminationDate !== undefined)
    data.terminationDate = safeUpdates.terminationDate
      ? new Date(safeUpdates.terminationDate)
      : null;

  const updatedUser = await prisma.user.update({
    where: { userId },
    data,
  });

  return updatedUser;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { userId },
  });
  return user;
}

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return users;
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: { userId },
  });
}

export type Project = {
  id: string; // Prisma uses Int for id, but legacy type says string? Schema says Int.
  // Wait, legacy type says: id: string. Schema says: id Int @id @default(autoincrement())
  // The 'uid' is the public string ID.
  // We need to match the return type expected by the app.
  // If the app expects 'id' as string, it might be using the 'uid' actually?
  // Checking schema.prisma: Project.id is Int. Project.uid is String.
  // Legacy postgres.ts type definition: id: string.
  // It's possible legacy code was mapping something or just wrong types.
  // Let's assume we return what Prisma returns.
  // However, for compatibility, if the UI uses 'id' as the unique string, it might mean 'uid'.
  // Let's stick to Prisma return types and cast if necessary or update type definition.
  // Updating Type Definition to match Reality implies we should output what we have.
  uid: string;
  name: string;
  description?: string;
  status: string;
  owner: string;
  startDate?: string;
  deadline?: string;
  budget?: number;
  progress: number;
  priority?: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// ============================================================================
// PROJECTS
// ============================================================================

export async function createProject(
  project: Omit<Project, "id" | "uid" | "createdAt" | "updatedAt">
) {
  const uid = `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const newProject = await prisma.project.create({
    data: {
      uid,
      name: project.name,
      description: project.description,
      status: project.status,
      owner: project.owner,
      startDate: project.startDate ? new Date(project.startDate) : null,
      deadline: project.deadline ? new Date(project.deadline) : null,
      budget: project.budget ? new Prisma.Decimal(project.budget) : null,
      progress: project.progress,
      priority: project.priority,
      userId: project.userId,
    },
  });

  return newProject;
}

export async function getProjectById(uid: string) {
  const project = await prisma.project.findUnique({
    where: { uid },
  });
  return project;
}

export async function getAllProjects(userId?: string) {
  if (userId) {
    return await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }
  return await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateProject(uid: string, updates: Partial<Project>) {
  const data: Prisma.ProjectUpdateInput = {};

  if (updates.name) data.name = updates.name;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status) data.status = updates.status;
  if (updates.progress !== undefined) data.progress = updates.progress;
  if (updates.priority !== undefined) data.priority = updates.priority;
  // Add other fields if needed

  const updated = await prisma.project.update({
    where: { uid },
    data,
  });
  return updated;
}

export async function deleteProject(uid: string) {
  await prisma.project.delete({
    where: { uid },
  });
}

// ============================================================================
// TASKS
// ============================================================================

export type Task = {
  id: string; // Again, Schema Int vs Type String. Fixing types to match expectations or Prisma.
  uid: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: string;
  due?: string;
  estimateHours?: number;
  loggedHours?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function createTask(
  task: Omit<Task, "id" | "uid" | "createdAt" | "updatedAt">
) {
  const uid = `task_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const newTask = await prisma.task.create({
    data: {
      uid,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      due: task.due ? new Date(task.due) : null,
      estimateHours: task.estimateHours
        ? new Prisma.Decimal(task.estimateHours)
        : null,
      loggedHours: new Prisma.Decimal(task.loggedHours || 0),
    },
  });

  return newTask;
}

export async function getTasksByProject(projectId: string) {
  return await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllTasks() {
  return await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTask(uid: string, updates: Partial<Task>) {
  const data: Prisma.TaskUpdateInput = {};
  if (updates.title) data.title = updates.title;
  if (updates.description !== undefined) data.description = updates.description;
  if (updates.status) data.status = updates.status;
  if (updates.priority) data.priority = updates.priority;
  if (updates.assignee !== undefined) data.assignee = updates.assignee;
  if (updates.loggedHours !== undefined)
    data.loggedHours = new Prisma.Decimal(updates.loggedHours);

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

// ============================================================================
// TIME LOGS
// ============================================================================

export async function addTimeLog(timeLog: {
  taskId: string;
  projectId: string;
  hours: number;
  note?: string;
  loggedBy: string;
}) {
  return await prisma.timeLog.create({
    data: {
      taskId: timeLog.taskId,
      projectId: timeLog.projectId,
      hours: new Prisma.Decimal(timeLog.hours),
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
