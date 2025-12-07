import { isValidUUID, isValidEmail, sanitizeString } from "../validation";

export type User = {
  userId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  avatarUrl?: string;
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
  hireDate?: string;
  terminationDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

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

  const result = await sql`
    INSERT INTO users (
      email, password_hash, full_name, avatar_url, is_active, system_role, job_title, department, timezone,
      theme_preference, phone_number, slack_handle, hourly_cost_rate, hourly_billable_rate, is_billable,
      employment_type, default_working_hours_per_day, hire_date, termination_date
    ) VALUES (
        ${sanitizedEmail}, ${user.passwordHash}, ${sanitizedFullName}, ${user.avatarUrl || null}, ${user.isActive},
      ${user.systemRole}, ${user.jobTitle || null}, ${user.department || null}, ${user.timezone},
      ${user.themePreference || "light"}, ${user.phoneNumber || null}, ${user.slackHandle || null},
      ${user.hourlyCostRate}, ${user.hourlyBillableRate}, ${user.isBillable}, ${user.employmentType},
      ${user.defaultWorkingHoursPerDay}, ${user.hireDate || null}, ${user.terminationDate || null}
    )
    RETURNING *
  `;
  return result.rows[0];
}

export async function updateUser(userId: string, updates: Partial<User>) {
  // Validate UUID format
  if (!isValidUUID(userId)) {
    throw new Error("Invalid user ID format");
  }

  // NEVER allow direct password hash updates - use separate password change function
  const { passwordHash, ...safeUpdates } = updates;

  // Validate email if being updated
  if (safeUpdates.email && !isValidEmail(safeUpdates.email)) {
    throw new Error("Invalid email format");
  }

  // Whitelist of allowed updatable fields
  const allowedFields = [
    "email",
    "fullName",
    "avatarUrl",
    "isActive",
    "systemRole",
    "jobTitle",
    "department",
    "timezone",
    "themePreference",
    "phoneNumber",
    "slackHandle",
    "hourlyCostRate",
    "hourlyBillableRate",
    "isBillable",
    "employmentType",
    "defaultWorkingHoursPerDay",
    "hireDate",
    "terminationDate",
  ];

  // Filter to only allowed fields
  const filteredUpdates: Partial<User> = Object.keys(safeUpdates)
    .filter((key) => allowedFields.includes(key))
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: safeUpdates[key as keyof typeof safeUpdates],
      }),
      {} as Partial<User>
    );

  // Sanitize string inputs
  if (filteredUpdates.fullName) {
    filteredUpdates.fullName = sanitizeString(filteredUpdates.fullName, 100);
  }
  if (filteredUpdates.email) {
    filteredUpdates.email = sanitizeString(filteredUpdates.email, 255);
  }

  const result = await sql`
    UPDATE users SET
      email = COALESCE(${filteredUpdates.email}, email),
      full_name = COALESCE(${filteredUpdates.fullName}, full_name),
      avatar_url = COALESCE(${filteredUpdates.avatarUrl}, avatar_url),
      is_active = COALESCE(${filteredUpdates.isActive}, is_active),
      system_role = COALESCE(${filteredUpdates.systemRole}, system_role),
      job_title = COALESCE(${filteredUpdates.jobTitle}, job_title),
      department = COALESCE(${filteredUpdates.department}, department),
      timezone = COALESCE(${filteredUpdates.timezone}, timezone),
      theme_preference = COALESCE(${filteredUpdates.themePreference}, theme_preference),
      phone_number = COALESCE(${filteredUpdates.phoneNumber}, phone_number),
      slack_handle = COALESCE(${filteredUpdates.slackHandle}, slack_handle),
      hourly_cost_rate = COALESCE(${filteredUpdates.hourlyCostRate}, hourly_cost_rate),
      hourly_billable_rate = COALESCE(${filteredUpdates.hourlyBillableRate}, hourly_billable_rate),
      is_billable = COALESCE(${filteredUpdates.isBillable}, is_billable),
      employment_type = COALESCE(${filteredUpdates.employmentType}, employment_type),
      default_working_hours_per_day = COALESCE(${filteredUpdates.defaultWorkingHoursPerDay}, default_working_hours_per_day),
      hire_date = COALESCE(${filteredUpdates.hireDate}, hire_date),
      termination_date = COALESCE(${filteredUpdates.terminationDate}, termination_date),
      updated_at = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `;
  return result.rows[0];
}

export async function getUserById(userId: string) {
  const result = await sql`SELECT * FROM users WHERE user_id = ${userId}`;
  return result.rows[0];
}

export async function getAllUsers() {
  const result = await sql`SELECT * FROM users ORDER BY updated_at DESC`;
  return result.rows;
}

export async function deleteUser(userId: string) {
  await sql`DELETE FROM users WHERE user_id = ${userId}`;
}
import { sql } from "@vercel/postgres";

export type Project = {
  id: string;
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

export type Task = {
  id: string;
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

// ============================================================================
// PROJECTS
// ============================================================================

export async function createProject(
  project: Omit<Project, "id" | "uid" | "createdAt" | "updatedAt">
) {
  const uid = `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const result = await sql`
    INSERT INTO projects (uid, name, description, status, owner, start_date, deadline, budget, progress, priority, user_id)
    VALUES (${uid}, ${project.name}, ${project.description || null}, ${project.status}, ${project.owner}, 
            ${project.startDate || null}, ${project.deadline || null}, ${project.budget || null}, 
            ${project.progress}, ${project.priority || null}, ${project.userId})
    RETURNING *
  `;

  return result.rows[0];
}

export async function getProjectById(uid: string) {
  const result = await sql`
    SELECT * FROM projects WHERE uid = ${uid}
  `;
  return result.rows[0];
}

export async function getAllProjects(userId?: string) {
  if (userId) {
    const result = await sql`
      SELECT * FROM projects WHERE user_id = ${userId} ORDER BY updated_at DESC
    `;
    return result.rows;
  }

  const result = await sql`
    SELECT * FROM projects ORDER BY updated_at DESC
  `;
  return result.rows;
}

export async function updateProject(uid: string, updates: Partial<Project>) {
  const result = await sql`
    UPDATE projects 
    SET 
      name = COALESCE(${updates.name}, name),
      description = COALESCE(${updates.description}, description),
      status = COALESCE(${updates.status}, status),
      progress = COALESCE(${updates.progress}, progress),
      priority = COALESCE(${updates.priority}, priority),
      updated_at = NOW()
    WHERE uid = ${uid}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteProject(uid: string) {
  await sql`DELETE FROM projects WHERE uid = ${uid}`;
}

// ============================================================================
// TASKS
// ============================================================================

export async function createTask(
  task: Omit<Task, "id" | "uid" | "createdAt" | "updatedAt">
) {
  const uid = `task_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const result = await sql`
    INSERT INTO tasks (uid, project_id, title, description, status, priority, assignee, due, estimate_hours, logged_hours)
    VALUES (${uid}, ${task.projectId}, ${task.title}, ${task.description || null}, ${task.status}, 
            ${task.priority}, ${task.assignee || null}, ${task.due || null}, 
            ${task.estimateHours || null}, ${task.loggedHours || 0})
    RETURNING *
  `;

  return result.rows[0];
}

export async function getTasksByProject(projectId: string) {
  const result = await sql`
    SELECT * FROM tasks WHERE project_id = ${projectId} ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function getAllTasks() {
  const result = await sql`
    SELECT * FROM tasks ORDER BY created_at DESC
  `;
  return result.rows;
}

export async function updateTask(uid: string, updates: Partial<Task>) {
  const result = await sql`
    UPDATE tasks 
    SET 
      title = COALESCE(${updates.title}, title),
      description = COALESCE(${updates.description}, description),
      status = COALESCE(${updates.status}, status),
      priority = COALESCE(${updates.priority}, priority),
      assignee = COALESCE(${updates.assignee}, assignee),
      logged_hours = COALESCE(${updates.loggedHours}, logged_hours),
      updated_at = NOW()
    WHERE uid = ${uid}
    RETURNING *
  `;
  return result.rows[0];
}

export async function deleteTask(uid: string) {
  await sql`DELETE FROM tasks WHERE uid = ${uid}`;
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
  const result = await sql`
    INSERT INTO time_logs (task_id, project_id, hours, note, logged_by)
    VALUES (${timeLog.taskId}, ${timeLog.projectId}, ${timeLog.hours}, 
            ${timeLog.note || null}, ${timeLog.loggedBy})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getTimeLogsByTask(taskId: string) {
  const result = await sql`
    SELECT * FROM time_logs WHERE task_id = ${taskId} ORDER BY logged_at DESC
  `;
  return result.rows;
}

export async function getTimeLogsByProject(projectId: string) {
  const result = await sql`
    SELECT * FROM time_logs WHERE project_id = ${projectId} ORDER BY logged_at DESC
  `;
  return result.rows;
}
