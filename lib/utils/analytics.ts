// ---- Analytics Utilities ----
// Burndown, velocity, completion stats, time estimates, risk analysis

import { getTasksByProject } from "./tasks";

// Helper to read time logs (duplicated from time-tracking to avoid circular dependency)
function readTimeLogs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:timeLogs");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Burndown/Burnup Chart Data
export type BurndownPoint = {
  date: string; // YYYY-MM-DD
  ideal: number; // ideal remaining work
  actual: number; // actual remaining work
  completed: number; // cumulative completed
};

export function getBurndownData(
  projectId: string,
  startDate: string,
  endDate: string
): BurndownPoint[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  const tasks = getTasksByProject(projectId);
  const totalTasks = tasks.length;

  // Get task completion history from time logs
  const logs = readTimeLogs().filter((l: any) => l.projectId === projectId);
  const taskCompletionMap = new Map<string, number>(); // taskId -> completion timestamp

  // Track when tasks were completed
  tasks.forEach((task) => {
    if (task.status === "done") {
      const taskLogs = logs.filter((l: any) => l.taskId === task.id);
      const lastLog =
        taskLogs.length > 0
          ? taskLogs.sort((a: any, b: any) => b.loggedAt - a.loggedAt)[0]
          : null;
      // Use the last log time or assume completed today
      taskCompletionMap.set(task.id, lastLog?.loggedAt || Date.now());
    }
  });

  const points: BurndownPoint[] = [];

  for (let i = 0; i <= totalDays; i++) {
    const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().slice(0, 10);
    const dayTimestamp = currentDate.getTime();

    // Ideal burndown (linear)
    const ideal = totalTasks - (totalTasks * i) / totalDays;

    // Actual: count tasks completed by this date
    const completedByDate = Array.from(taskCompletionMap.values()).filter(
      (timestamp) => timestamp <= dayTimestamp + 24 * 60 * 60 * 1000
    ).length;
    const actual = totalTasks - completedByDate;

    points.push({
      date: dateStr,
      ideal: parseFloat(ideal.toFixed(2)),
      actual,
      completed: completedByDate,
    });
  }

  return points;
}

// Velocity Metrics
export type VelocityData = {
  period: string; // Week/Sprint label
  completed: number; // tasks completed
  points: number; // story points if using them
  avgVelocity: number; // rolling average
  trend: "up" | "down" | "stable";
};

export function getVelocityMetrics(
  projectId: string,
  weeks = 8
): VelocityData[] {
  const tasks = getTasksByProject(projectId);
  const logs = readTimeLogs().filter((l: any) => l.projectId === projectId);

  const weeklyData: VelocityData[] = [];
  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(
      now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
    );
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    // Count tasks with logs in this week (as proxy for completion)
    const tasksCompletedThisWeek = new Set(
      logs
        .filter(
          (l: any) =>
            l.loggedAt >= weekStart.getTime() && l.loggedAt < weekEnd.getTime()
        )
        .map((l: any) => l.taskId)
    ).size;

    // Calculate points (use estimate hours as proxy)
    const pointsCompleted = Array.from(
      new Set(
        logs
          .filter(
            (l: any) =>
              l.loggedAt >= weekStart.getTime() &&
              l.loggedAt < weekEnd.getTime()
          )
          .map((l: any) => l.taskId)
      )
    )
      .map((taskId) => tasks.find((t) => t.id === taskId))
      .filter((t) => t)
      .reduce((sum, t) => sum + (t!.estimateHours || 1), 0);

    const weekLabel = `Week ${weeks - i}`;

    weeklyData.push({
      period: weekLabel,
      completed: tasksCompletedThisWeek,
      points: parseFloat(pointsCompleted.toFixed(1)),
      avgVelocity: 0, // will calculate after
      trend: "stable",
    });
  }

  // Calculate rolling average and trend
  weeklyData.forEach((week, idx) => {
    const recentWeeks = weeklyData.slice(Math.max(0, idx - 2), idx + 1);
    week.avgVelocity = parseFloat(
      (
        recentWeeks.reduce((sum, w) => sum + w.completed, 0) /
        recentWeeks.length
      ).toFixed(1)
    );

    if (idx > 0) {
      const prev = weeklyData[idx - 1];
      if (week.completed > prev.completed * 1.1) week.trend = "up";
      else if (week.completed < prev.completed * 0.9) week.trend = "down";
      else week.trend = "stable";
    }
  });

  return weeklyData;
}

// Task Completion Rate
export type CompletionStats = {
  date: string;
  completed: number;
  total: number;
  rate: number; // percentage
};

export function getCompletionRateStats(
  projectId: string,
  days = 30
): CompletionStats[] {
  const tasks = getTasksByProject(projectId);
  const logs = readTimeLogs().filter((l: any) => l.projectId === projectId);

  const stats: CompletionStats[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    const dayStart = date.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    // Count unique tasks with logs on this day
    const completedToday = new Set(
      logs
        .filter((l: any) => l.loggedAt >= dayStart && l.loggedAt < dayEnd)
        .map((l: any) => l.taskId)
    ).size;

    const total = tasks.length;
    const rate =
      total > 0 ? parseFloat(((completedToday / total) * 100).toFixed(1)) : 0;

    stats.push({
      date: dateStr,
      completed: completedToday,
      total,
      rate,
    });
  }

  return stats;
}

// Time vs Estimate Comparison
export type TimeAccuracy = {
  taskId: string;
  taskTitle: string;
  estimated: number;
  logged: number;
  variance: number; // percentage over/under
  accuracy: "over" | "under" | "accurate";
};

export function getTimeEstimateAccuracy(projectId: string): {
  tasks: TimeAccuracy[];
  avgVariance: number;
  overCount: number;
  underCount: number;
  accuracyRate: number;
} {
  const tasks = getTasksByProject(projectId).filter(
    (t) =>
      t.estimateHours &&
      t.estimateHours > 0 &&
      t.loggedHours &&
      t.loggedHours > 0
  );

  const taskAccuracy: TimeAccuracy[] = tasks.map((task) => {
    const estimated = task.estimateHours!;
    const logged = task.loggedHours!;
    const variance = parseFloat(
      (((logged - estimated) / estimated) * 100).toFixed(1)
    );

    let accuracy: "over" | "under" | "accurate";
    if (variance > 10) accuracy = "over";
    else if (variance < -10) accuracy = "under";
    else accuracy = "accurate";

    return {
      taskId: task.id,
      taskTitle: task.title,
      estimated,
      logged,
      variance,
      accuracy,
    };
  });

  const avgVariance =
    taskAccuracy.length > 0
      ? parseFloat(
          (
            taskAccuracy.reduce((sum, t) => sum + Math.abs(t.variance), 0) /
            taskAccuracy.length
          ).toFixed(1)
        )
      : 0;

  const overCount = taskAccuracy.filter((t) => t.accuracy === "over").length;
  const underCount = taskAccuracy.filter((t) => t.accuracy === "under").length;
  const accuracyRate =
    taskAccuracy.length > 0
      ? parseFloat(
          (
            (taskAccuracy.filter((t) => t.accuracy === "accurate").length /
              taskAccuracy.length) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    tasks: taskAccuracy,
    avgVariance,
    overCount,
    underCount,
    accuracyRate,
  };
}
