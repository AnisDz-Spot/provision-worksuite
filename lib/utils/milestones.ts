// ---- Milestones Storage ----
// Stored key: pv:milestones
// Structure: Array<{ id: string; projectId: string; title: string; start?: string; target?: string; description?: string }>

import { getTasksByProject } from "./tasks";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { fetchWithCsrf } from "@/lib/csrf-client";

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

export async function getMilestonesByProject(
  projectId: string
): Promise<Milestone[]> {
  if (shouldUseDatabaseData()) {
    try {
      const res = await fetch(`/api/milestones?projectId=${projectId}`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        return result.data.map((m: any) => ({
          id: m.id,
          projectId: String(m.projectId),
          title: m.name,
          start: m.startDate ? m.startDate.split("T")[0] : undefined,
          target: m.dueDate ? m.dueDate.split("T")[0] : undefined,
          description: m.description || undefined,
        }));
      }
    } catch (e) {
      console.error("DB Milestones error:", e);
    }
  }
  return readMilestones().filter((m) => m.projectId === projectId);
}

export async function upsertMilestone(m: Milestone) {
  if (shouldUseDatabaseData()) {
    try {
      await fetchWithCsrf("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m),
      });
      return;
    } catch (e) {
      console.error("DB Milestones upsert error:", e);
    }
  }
  const all = readMilestones();
  const idx = all.findIndex((x) => x.id === m.id);
  if (idx >= 0) all[idx] = m;
  else all.push(m);
  writeMilestones(all);
}

export async function deleteMilestone(id: string) {
  if (shouldUseDatabaseData()) {
    try {
      await fetchWithCsrf(`/api/milestones/${id}`, { method: "DELETE" });
      return;
    } catch (e) {
      console.error("DB Milestones delete error:", e);
    }
  }
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

export function getOverdueMilestoneCountSync(
  projectId: string,
  providedMilestones?: Milestone[]
): number {
  const today = new Date().toISOString().slice(0, 10);
  const milestones =
    providedMilestones ||
    readMilestones().filter((m) => m.projectId === projectId);
  return milestones.filter((m) => {
    if (!m.target) return false;
    if (m.target >= today) return false;
    // consider overdue only if not fully done
    const prog = getMilestoneTaskProgress(projectId, m.id);
    return prog.percent < 100;
  }).length;
}

export async function getOverdueMilestoneCount(
  projectId: string
): Promise<number> {
  const milestones = await getMilestonesByProject(projectId);
  return getOverdueMilestoneCountSync(projectId, milestones);
}
