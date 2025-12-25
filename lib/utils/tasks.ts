// ---- Tasks Storage (per project) ----
// Stored key: pv:tasks
// Structure: Array<{ id: string; projectId: string; title: string; status: 'todo'|'in-progress'|'review'|'done'; assignee?: string; due?: string; priority?: 'low'|'medium'|'high' }>

export type TaskItem = {
  id: string;
  projectId: string;
  title: string;
  status: "todo" | "in-progress" | "review" | "done";
  assignee?: string;
  due?: string;
  priority?: "low" | "medium" | "high";
  milestoneId?: string;
  estimateHours?: number;
  loggedHours?: number;
};

function _readTasks(): TaskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:tasks");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Export readTasks for external use
export function readTasks(): TaskItem[] {
  return _readTasks();
}

function writeTasks(tasks: TaskItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:tasks", JSON.stringify(tasks));
  } catch {}
}

export function getTasksByProject(projectId: string): TaskItem[] {
  return readTasks().filter((t) => t.projectId === projectId);
}

export function getTasksByAssignee(assignee: string): TaskItem[] {
  return readTasks().filter((t) => t.assignee === assignee);
}

export function upsertTask(task: TaskItem) {
  const all = readTasks();
  const idx = all.findIndex((t) => t.id === task.id);
  if (idx >= 0) all[idx] = task;
  else all.push(task);
  writeTasks(all);
}

export function deleteTask(taskId: string) {
  const all = readTasks();
  writeTasks(all.filter((t) => t.id !== taskId));
}

export function getTaskCompletionForProject(
  projectId: string,
  providedTasks?: TaskItem[]
): {
  total: number;
  done: number;
  percent: number;
} {
  const tasks = providedTasks || getTasksByProject(projectId);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}
