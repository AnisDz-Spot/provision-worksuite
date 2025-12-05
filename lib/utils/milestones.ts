// ---- Milestones Storage ----
// Stored key: pv:milestones
// Structure: Array<{ id: string; projectId: string; title: string; start?: string; target?: string; description?: string }>

import { getTasksByProject } from "./tasks";

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  start?: string; // YYYY-MM-DD
  target?: string; // YYYY-MM-DD
  description?: string;
};

function readMilestones(): Milestone[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:milestones");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeMilestones(items: Milestone[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:milestones", JSON.stringify(items));
  } catch {}
}

export function getMilestonesByProject(projectId: string): Milestone[] {
  return readMilestones().filter((m) => m.projectId === projectId);
}

export function upsertMilestone(m: Milestone) {
  const all = readMilestones();
  const idx = all.findIndex((x) => x.id === m.id);
  if (idx >= 0) all[idx] = m;
  else all.push(m);
  writeMilestones(all);
}

export function deleteMilestone(id: string) {
  writeMilestones(readMilestones().filter((m) => m.id !== id));
}

export function getMilestoneTaskProgress(
  projectId: string,
  milestoneId: string
): { total: number; done: number; percent: number } {
  const tasks = getTasksByProject(projectId).filter(
    (t) => t.milestoneId === milestoneId
  );
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

export function getOverdueMilestoneCount(projectId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const milestones = getMilestonesByProject(projectId);
  return milestones.filter((m) => {
    if (!m.target) return false;
    if (m.target >= today) return false;
    // consider overdue only if not fully done
    const prog = getMilestoneTaskProgress(projectId, m.id);
    return prog.percent < 100;
  }).length;
}
