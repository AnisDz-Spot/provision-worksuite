// ---- Project Health Score ----
// Health scoring and monitoring utilities

import { getProjectEvents } from "./project-events";
import { getTaskCompletionForProject, getTasksByProject } from "./tasks";
import { getProjectDependencies } from "./project-dependencies";
import { getOverdueMilestoneCount } from "./milestones";

export type HealthScore = {
  score: number; // 0-100
  status: "critical" | "warning" | "good" | "excellent";
  factors: {
    deadline: number;
    activity: number;
    dependencies: number;
    completion: number;
  };
};

export type HealthWeights = {
  overduePenaltyPerTask?: number; // default 2
  overduePenaltyCap?: number; // default 20
  milestoneOverduePenaltyPerMilestone?: number; // default 3
  milestoneOverduePenaltyCap?: number; // default 15
};

function readHealthWeights(): HealthWeights {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("pv:healthWeights") || "{}") || {};
  } catch {
    return {};
  }
}

export function getHealthWeights(): HealthWeights {
  return readHealthWeights();
}

export function setHealthWeights(weights: HealthWeights) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      "pv:healthWeights",
      JSON.stringify({ ...readHealthWeights(), ...weights })
    );
  } catch {}
}

export function calculateProjectHealth(project: {
  id: string;
  deadline?: string;
  status?: string;
}): HealthScore {
  let score = 100;
  const factors = {
    deadline: 100,
    activity: 100,
    dependencies: 100,
    completion: 100,
  };

  // Deadline factor (30% weight)
  if (project.deadline) {
    const daysLeft = Math.ceil(
      (new Date(project.deadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysLeft < 0) {
      factors.deadline = 0; // Overdue
      score -= 30;
    } else if (daysLeft < 3) {
      factors.deadline = 40;
      score -= 18;
    } else if (daysLeft < 7) {
      factors.deadline = 70;
      score -= 9;
    }
  }

  // Activity factor (20% weight) - based on recent events
  const events = getProjectEvents(project.id);
  const recentEvents = events.filter(
    (e) => Date.now() - e.timestamp < 7 * 24 * 60 * 60 * 1000
  );
  if (recentEvents.length === 0 && events.length > 0) {
    factors.activity = 50; // No activity in 7 days
    score -= 10;
  } else if (recentEvents.length < 2) {
    factors.activity = 75;
    score -= 5;
  }

  // Completion factor (30% weight)
  const taskStats = getTaskCompletionForProject(project.id);
  if (taskStats.total > 0) {
    factors.completion = taskStats.percent; // 0..100
    const completionPenalty = Math.round((100 - taskStats.percent) * 0.3); // 30% weight
    score -= completionPenalty;
  } else {
    if (project.status === "Completed") {
      factors.completion = 100;
    } else if (project.status === "Active") {
      factors.completion = 80;
      score -= 6;
    } else if (project.status === "In Progress") {
      factors.completion = 60;
      score -= 12;
    } else if (project.status === "Paused") {
      factors.completion = 30;
      score -= 21;
    }
  }

  // Dependencies factor (20% weight)
  const deps = getProjectDependencies(project.id);
  if (deps.length > 0) {
    // Check if any dependencies are not completed
    try {
      const raw = localStorage.getItem("pv:projects");
      const projects = raw ? JSON.parse(raw) : [];
      const incompleteDeps = deps.filter((depId) => {
        const dep = projects.find((p: any) => p.id === depId);
        return dep && dep.status !== "Completed";
      });
      if (incompleteDeps.length > 0) {
        factors.dependencies = Math.max(30, 100 - incompleteDeps.length * 20);
        score -= incompleteDeps.length * 4;
      }
    } catch {}
  }

  // Overdue tasks penalty
  const overdue = getOverdueTaskCount(project.id);
  const overduePenaltyPerTask = getHealthWeights().overduePenaltyPerTask ?? 2;
  const overduePenaltyCap = getHealthWeights().overduePenaltyCap ?? 20;
  if (overdue > 0) {
    score -= Math.min(overdue * overduePenaltyPerTask, overduePenaltyCap);
  }

  // Overdue milestones penalty
  const overdueMilestones = getOverdueMilestoneCount(project.id);
  const msPenaltyPer =
    getHealthWeights().milestoneOverduePenaltyPerMilestone ?? 3;
  const msPenaltyCap = getHealthWeights().milestoneOverduePenaltyCap ?? 15;
  if (overdueMilestones > 0) {
    score -= Math.min(overdueMilestones * msPenaltyPer, msPenaltyCap);
  }

  score = Math.max(0, Math.min(100, score));

  let status: HealthScore["status"];
  if (score >= 85) status = "excellent";
  else if (score >= 65) status = "good";
  else if (score >= 40) status = "warning";
  else status = "critical";

  return { score, status, factors };
}

// ---- Health History ----
type HealthPoint = { projectId: string; date: string; score: number };

function readHealthHistory(): HealthPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectHealthHistory");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHealthHistory(data: HealthPoint[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectHealthHistory", JSON.stringify(data));
  } catch {}
}

export function snapshotHealth(projectId: string, score: number) {
  const today = new Date().toISOString().slice(0, 10);
  const all = readHealthHistory();
  const idx = all.findIndex(
    (p) => p.projectId === projectId && p.date === today
  );
  if (idx >= 0) all[idx].score = score;
  else all.push({ projectId, date: today, score });
  writeHealthHistory(all);
}

export function getHealthSeries(projectId: string, days = 14): number[] {
  const all = readHealthHistory().filter((p) => p.projectId === projectId);
  const map = new Map(all.map((p) => [p.date, p.score] as const));
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push(map.get(key) ?? (null as any));
  }
  // Fill nulls by carrying last known
  let last = 100;
  return out.map((v) => {
    if (typeof v === "number") {
      last = v;
      return v;
    }
    return last;
  });
}

export function getOverdueTaskCount(projectId: string): number {
  const tasks = getTasksByProject(projectId);
  const today = new Date().toISOString().slice(0, 10);
  return tasks.filter((t) => t.status !== "done" && t.due && t.due < today)
    .length;
}

export function getHealthSnapshot(projectId: string) {
  const all = readHealthHistory().filter((p) => p.projectId === projectId);
  const latest = all.sort((a, b) => b.date.localeCompare(a.date))[0];
  return latest ? latest.score : null;
}
