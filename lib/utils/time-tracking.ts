// ---- Time Tracking Utilities ----
// Per-task simple time logs stored within tasks (aggregate only)

import { readTasks, getTasksByProject, TaskItem } from "./tasks";

export type TimeLog = {
  id: string;
  taskId: string;
  projectId: string;
  hours: number; // fractional allowed
  note?: string;
  loggedAt: number;
  loggedBy?: string;
};

// We persist time logs by appending to a dedicated key so detailed history is available
// Key: pv:timeLogs
function readTimeLogs(): TimeLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:timeLogs");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeTimeLogs(logs: TimeLog[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:timeLogs", JSON.stringify(logs));
  } catch {}
}

export function getTimeLogsForTask(taskId: string): TimeLog[] {
  return readTimeLogs()
    .filter((l) => l.taskId === taskId)
    .sort((a, b) => b.loggedAt - a.loggedAt);
}

export function addTimeLog(
  taskId: string,
  projectId: string,
  hours: number,
  note?: string,
  loggedBy?: string
): TimeLog | null {
  if (!hours || hours <= 0) return null;
  const log: TimeLog = {
    id: `tl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    taskId,
    projectId,
    hours,
    note,
    loggedAt: Date.now(),
    loggedBy: loggedBy || "Unknown",
  };
  const all = readTimeLogs();
  all.push(log);
  writeTimeLogs(all);

  // Also update the task's aggregate loggedHours
  const tasks = readTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    const current = tasks[idx];
    const currentLogged = current.loggedHours || 0;
    tasks[idx] = {
      ...current,
      loggedHours: parseFloat((currentLogged + hours).toFixed(2)),
    };
    // Note: writeTasks is not exported, need to use upsertTask
    // For now, directly write - will fix with proper import
    if (typeof window !== "undefined") {
      localStorage.setItem("pv:tasks", JSON.stringify(tasks));
    }
  }

  return log;
}

export function getProjectTimeRollup(
  projectId: string,
  providedTasks?: TaskItem[]
): {
  estimate: number;
  logged: number;
  remaining: number;
} {
  const tasks = providedTasks || getTasksByProject(projectId);
  const estimate = tasks.reduce((sum, t) => sum + (t.estimateHours || 0), 0);
  const logged = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
  const remaining = Math.max(0, parseFloat((estimate - logged).toFixed(2)));
  return {
    estimate: parseFloat(estimate.toFixed(2)),
    logged: parseFloat(logged.toFixed(2)),
    remaining,
  };
}
