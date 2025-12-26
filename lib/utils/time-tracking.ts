import { readTasks, getTasksByProject, TaskItem } from "./tasks";
import { logProjectEvent } from "./project-events";
import { shouldUseMockData } from "@/lib/dataSource";

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

export async function addTimeLog(
  taskId: string,
  projectId: string,
  hours: number,
  note?: string,
  loggedBy?: string
): Promise<TimeLog | null> {
  if (!hours || hours <= 0) return null;

  const logEntry: TimeLog = {
    id: `tl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    taskId,
    projectId,
    hours,
    note,
    loggedAt: Date.now(),
    loggedBy: loggedBy || "Unknown",
  };

  if (!shouldUseMockData()) {
    try {
      // 1. Fetch current task to get current loggedHours
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.success && data.task) {
        const currentLogged = data.task.loggedHours || 0;
        const newLogged = parseFloat((currentLogged + hours).toFixed(2));

        // 2. Update task in DB
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ loggedHours: newLogged }),
        });

        // 3. Log activity
        await logProjectEvent(projectId, "timelog", {
          taskId,
          taskTitle: data.task.title,
          hours,
          note,
        });

        return logEntry;
      }
    } catch (error) {
      console.error("Failed to add time log to database:", error);
    }
  }

  // Fallback to localStorage for mock mode or if DB fails
  const all = readTimeLogs();
  all.push(logEntry);
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
    if (typeof window !== "undefined") {
      localStorage.setItem("pv:tasks", JSON.stringify(tasks));
    }

    // Log activity in localStorage
    logProjectEvent(projectId, "timelog", {
      taskId,
      taskTitle: current.title,
      hours,
      note,
    });
  }

  return logEntry;
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
