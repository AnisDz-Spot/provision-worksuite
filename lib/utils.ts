import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Project Event Logging Utilities ----
// Stored in localStorage key `pv:projectEvents`
// Shape: { id, projectId, type, timestamp, data }
export type ProjectEvent = {
  id: string;
  projectId: string;
  type: "create" | "edit" | "star" | "unstar" | "delete";
  timestamp: number;
  data?: Record<string, any>;
};

function readEvents(): ProjectEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectEvents");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeEvents(events: ProjectEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectEvents", JSON.stringify(events));
  } catch {}
}

export function logProjectEvent(
  projectId: string,
  type: ProjectEvent["type"],
  data?: Record<string, any>
) {
  const ev: ProjectEvent = {
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    projectId,
    type,
    timestamp: Date.now(),
    data,
  };
  const existing = readEvents();
  existing.push(ev);
  writeEvents(existing);
}

export function getProjectEvents(projectId: string): ProjectEvent[] {
  return readEvents()
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ---- Project Comments Utilities ----
// Stored in localStorage key `pv:projectComments`
// Shape: { id, projectId, author, content(html), createdAt }
export type ProjectComment = {
  id: string;
  projectId: string;
  author: string;
  content: string; // HTML produced by RichTextEditor
  createdAt: number;
};

function readComments(): ProjectComment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectComments");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeComments(comments: ProjectComment[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectComments", JSON.stringify(comments));
  } catch {}
}

export function addProjectComment(
  projectId: string,
  author: string,
  content: string
) {
  const comment: ProjectComment = {
    id: `c_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    projectId,
    author,
    content,
    createdAt: Date.now(),
  };
  const existing = readComments();
  existing.push(comment);
  writeComments(existing);
  return comment;
}

export function deleteProjectComment(id: string) {
  const existing = readComments();
  const filtered = existing.filter((c) => c.id !== id);
  writeComments(filtered);
}

export function getProjectComments(projectId: string): ProjectComment[] {
  return readComments()
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Utility to highlight @mentions inside raw HTML (very lightweight)
export function highlightMentions(html: string): string {
  return html.replace(/(^|\s)@([A-Za-z0-9_\-]+)/g, (match, pre, handle) => {
    return `${pre}<span class="text-primary font-medium">@${handle}</span>`;
  });
}

// ---- Project Dependencies Utilities ----
// Stored key: pv:projectDeps
// Structure: Array<{ projectId: string; dependsOn: string[] }>
export type ProjectDeps = { projectId: string; dependsOn: string[] };

function readDeps(): ProjectDeps[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectDeps");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeDeps(deps: ProjectDeps[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectDeps", JSON.stringify(deps));
  } catch {}
}

export function getProjectDependencies(projectId: string): string[] {
  const all = readDeps();
  const found = all.find((d) => d.projectId === projectId);
  return found ? found.dependsOn : [];
}

export function setProjectDependencies(projectId: string, dependsOn: string[]) {
  const all = readDeps();
  const next = all.some((d) => d.projectId === projectId)
    ? all.map((d) => (d.projectId === projectId ? { ...d, dependsOn } : d))
    : [...all, { projectId, dependsOn }];
  writeDeps(next);
}

export function addProjectDependency(projectId: string, depId: string) {
  if (projectId === depId) return; // prevent self dependency
  const current = getProjectDependencies(projectId);
  if (current.includes(depId)) return;
  setProjectDependencies(projectId, [...current, depId]);
}

export function removeProjectDependency(projectId: string, depId: string) {
  const current = getProjectDependencies(projectId);
  setProjectDependencies(
    projectId,
    current.filter((id) => id !== depId)
  );
}

// Reverse lookup (projects that depend on this one)
export function getDependentsOf(projectId: string): string[] {
  return readDeps()
    .filter((d) => d.dependsOn.includes(projectId))
    .map((d) => d.projectId);
}

// Incomplete dependency ids for a project (dependency projects not marked Completed)
export function getIncompleteDependencyIds(projectId: string): string[] {
  const deps = getProjectDependencies(projectId);
  if (deps.length === 0) return [];
  try {
    const raw = localStorage.getItem("pv:projects");
    const projects = raw ? JSON.parse(raw) : [];
    return deps.filter((depId) => {
      const dep = projects.find((p: any) => p.id === depId);
      return dep && dep.status !== "Completed";
    });
  } catch {
    return deps;
  }
}

// ---- Saved Views Utilities ----
// Stored key: pv:savedViews
// Structure: Array<{ id: string; name: string; query: string; status: string; sortBy: string; starredOnly: boolean }>
export type SavedView = {
  id: string;
  name: string;
  query: string;
  status: string;
  sortBy: string;
  starredOnly: boolean;
  clientFilter?: string;
};

function readViews(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:savedViews");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeViews(views: SavedView[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:savedViews", JSON.stringify(views));
  } catch {}
}

export function getSavedViews(): SavedView[] {
  return readViews();
}

export function saveView(view: Omit<SavedView, "id">): SavedView {
  const newView: SavedView = {
    ...view,
    id: `v_${Date.now()}_${Math.random().toString(16).slice(2)}`,
  };
  const all = readViews();
  all.push(newView);
  writeViews(all);
  return newView;
}

export function deleteSavedView(id: string) {
  const all = readViews();
  writeViews(all.filter((v) => v.id !== id));
}

// ---- Project Health Score ----
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
  // Prefer task-based completion when tasks exist; otherwise fall back to status mapping
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

  // Overdue tasks penalty (configurable weight)
  // Default: subtract 2 points per overdue task up to 20 points
  const overdue = getOverdueTaskCount(project.id);
  const overduePenaltyPerTask = getHealthWeights().overduePenaltyPerTask ?? 2;
  const overduePenaltyCap = getHealthWeights().overduePenaltyCap ?? 20;
  if (overdue > 0) {
    score -= Math.min(overdue * overduePenaltyPerTask, overduePenaltyCap);
  }

  // Overdue milestones penalty (configurable)
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

// ---- Health Weights and History ----
// Stored key: pv:healthWeights
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

// Stored key: pv:projectHealthHistory
// Structure: Array<{ projectId: string; date: string (YYYY-MM-DD); score: number }>
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

// ---- Milestones Storage ----
// Stored key: pv:milestones
// Structure: Array<{ id: string; projectId: string; title: string; start?: string; target?: string; description?: string }>
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

// ---- Project Files Storage ----
// Stored key: pv:projectFiles
// Structure: Array<{ id: string; projectId: string; name: string; size: number; type: string; dataUrl: string; uploadedAt: number; uploadedBy: string; version?: number }>
export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 data URL
  uploadedAt: number;
  uploadedBy: string;
  version?: number; // starts at 1
};

function readFiles(): ProjectFile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectFiles");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeFiles(files: ProjectFile[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectFiles", JSON.stringify(files));
  } catch {}
}

export function getProjectFiles(projectId: string): ProjectFile[] {
  return readFiles()
    .filter((f) => f.projectId === projectId)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
}

export async function addProjectFile(
  projectId: string,
  file: File,
  uploadedBy: string
): Promise<ProjectFile | null> {
  try {
    // Convert to base64 data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Determine version based on existing files with same name for this project
    const siblings = getProjectFiles(projectId).filter(
      (f) => f.name === file.name
    );
    const nextVersion =
      siblings.length > 0
        ? Math.max(...siblings.map((s) => s.version || 1)) + 1
        : 1;

    const newFile: ProjectFile = {
      id: `f_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      projectId,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
      uploadedAt: Date.now(),
      uploadedBy,
      version: nextVersion,
    };

    const all = readFiles();
    all.push(newFile);
    writeFiles(all);
    return newFile;
  } catch (error) {
    console.error("Failed to add file:", error);
    return null;
  }
}

export function deleteProjectFile(id: string) {
  const all = readFiles();
  writeFiles(all.filter((f) => f.id !== id));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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

function readTasks(): TaskItem[] {
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
export { readTasks };

// Read projects from localStorage
export function readProjects(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projects");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
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

export function getTaskCompletionForProject(projectId: string): {
  total: number;
  done: number;
  percent: number;
} {
  const tasks = getTasksByProject(projectId);
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, percent };
}

// ---- Time Tracking Utilities ----
// Per-task simple time logs stored within tasks (aggregate only)
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
    writeTasks(tasks);
  }

  return log;
}

export function getProjectTimeRollup(projectId: string): {
  estimate: number;
  logged: number;
  remaining: number;
} {
  const tasks = getTasksByProject(projectId);
  const estimate = tasks.reduce((sum, t) => sum + (t.estimateHours || 0), 0);
  const logged = tasks.reduce((sum, t) => sum + (t.loggedHours || 0), 0);
  const remaining = Math.max(0, parseFloat((estimate - logged).toFixed(2)));
  return {
    estimate: parseFloat(estimate.toFixed(2)),
    logged: parseFloat(logged.toFixed(2)),
    remaining,
  };
}

// ---- Project Templates ----
export type ProjectTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  projectData: {
    status: "Active" | "Completed" | "Paused" | "In Progress";
    priority?: "low" | "medium" | "high";
    categories?: string[];
    privacy?: "public" | "team" | "private";
  };
  tasks: Array<{
    title: string;
    status: "todo" | "in-progress" | "review" | "done";
    priority: "low" | "medium" | "high";
    estimateHours?: number;
    daysFromStart?: number;
    assigneeRole?: string;
  }>;
  milestones?: Array<{
    name: string;
    description: string;
    daysFromStart: number;
  }>;
  createdAt: number;
};

function readTemplates(): ProjectTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:templates");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeTemplates(templates: ProjectTemplate[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:templates", JSON.stringify(templates));
  } catch {}
}

export function getAllTemplates(): ProjectTemplate[] {
  return readTemplates();
}

export function getTemplateById(id: string): ProjectTemplate | null {
  return readTemplates().find((t) => t.id === id) || null;
}

export function saveAsTemplate(
  name: string,
  description: string,
  category: string,
  projectId: string
): ProjectTemplate {
  const projects =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pv:projects") || "[]")
      : [];
  const project = projects.find((p: any) => p.id === projectId);

  const tasks = getTasksByProject(projectId).map((t) => ({
    title: t.title,
    status: t.status,
    priority: t.priority || "medium",
    estimateHours: t.estimateHours,
    daysFromStart: 0,
    assigneeRole: "member",
  }));

  const milestones = getMilestonesByProject(projectId).map((m) => ({
    name: m.title,
    description: m.description || "",
    daysFromStart: 0,
  }));

  const template: ProjectTemplate = {
    id: `tmpl_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name,
    description,
    category,
    tags: project?.tags || [],
    projectData: {
      status: "Active",
      priority: project?.priority,
      categories: project?.categories,
      privacy: project?.privacy || "team",
    },
    tasks,
    milestones,
    createdAt: Date.now(),
  };

  const all = readTemplates();
  all.push(template);
  writeTemplates(all);
  return template;
}

export function createProjectFromTemplate(
  templateId: string,
  projectName: string,
  owner: string,
  startDate: string
): string {
  const template = getTemplateById(templateId);
  if (!template) throw new Error("Template not found");

  const projectId = `p_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const start = new Date(startDate);

  const projects =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pv:projects") || "[]")
      : [];
  const newProject = {
    id: projectId,
    name: projectName,
    owner,
    ...template.projectData,
    deadline: new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    tags: template.tags,
    members: [{ name: owner }],
    cover: "",
    isTemplate: false,
  };
  projects.push(newProject);
  if (typeof window !== "undefined") {
    localStorage.setItem("pv:projects", JSON.stringify(projects));
  }

  template.tasks.forEach((t, idx) => {
    const dueDate = new Date(
      start.getTime() + (t.daysFromStart || idx * 3) * 24 * 60 * 60 * 1000
    );
    const task: TaskItem = {
      id: `task_${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
      projectId,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assigneeRole === "owner" ? owner : "You",
      due: dueDate.toISOString().split("T")[0],
      estimateHours: t.estimateHours,
    };
    upsertTask(task);
  });

  if (template.milestones) {
    template.milestones.forEach((m) => {
      const dueDate = new Date(
        start.getTime() + m.daysFromStart * 24 * 60 * 60 * 1000
      );
      upsertMilestone({
        id: `milestone_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        projectId,
        title: m.name,
        target: dueDate.toISOString().split("T")[0],
        description: m.description,
      });
    });
  }

  logProjectEvent(projectId, "create", { fromTemplate: templateId });
  return projectId;
}

export function deleteTemplate(templateId: string) {
  const all = readTemplates();
  writeTemplates(all.filter((t) => t.id !== templateId));
}

// ---- Analytics Utilities ----

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
  const logs = readTimeLogs().filter((l) => l.projectId === projectId);
  const taskCompletionMap = new Map<string, number>(); // taskId -> completion timestamp

  // Track when tasks were completed
  tasks.forEach((task) => {
    if (task.status === "done") {
      const taskLogs = logs.filter((l) => l.taskId === task.id);
      const lastLog =
        taskLogs.length > 0
          ? taskLogs.sort((a, b) => b.loggedAt - a.loggedAt)[0]
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
  const logs = readTimeLogs().filter((l) => l.projectId === projectId);

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
          (l) =>
            l.loggedAt >= weekStart.getTime() && l.loggedAt < weekEnd.getTime()
        )
        .map((l) => l.taskId)
    ).size;

    // Calculate points (use estimate hours as proxy)
    const pointsCompleted = Array.from(
      new Set(
        logs
          .filter(
            (l) =>
              l.loggedAt >= weekStart.getTime() &&
              l.loggedAt < weekEnd.getTime()
          )
          .map((l) => l.taskId)
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
  const logs = readTimeLogs().filter((l) => l.projectId === projectId);

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
        .filter((l) => l.loggedAt >= dayStart && l.loggedAt < dayEnd)
        .map((l) => l.taskId)
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

// Risk Score Calculation
export type RiskAnalysis = {
  score: number; // 0-100, higher = more risk
  level: "low" | "medium" | "high" | "critical";
  factors: {
    overdueTasksRisk: number;
    velocityRisk: number;
    blockerRisk: number;
    deadlineRisk: number;
    estimateAccuracyRisk: number;
  };
  recommendations: string[];
};

export function calculateRiskScore(
  projectId: string,
  deadline?: string
): RiskAnalysis {
  let riskScore = 0;
  const factors = {
    overdueTasksRisk: 0,
    velocityRisk: 0,
    blockerRisk: 0,
    deadlineRisk: 0,
    estimateAccuracyRisk: 0,
  };
  const recommendations: string[] = [];

  const tasks = getTasksByProject(projectId);
  const totalTasks = tasks.length;

  // 1. Overdue tasks risk (25% weight)
  const overdueCount = getOverdueTaskCount(projectId);
  if (overdueCount > 0) {
    factors.overdueTasksRisk = Math.min(
      100,
      (overdueCount / Math.max(1, totalTasks)) * 100
    );
    riskScore += factors.overdueTasksRisk * 0.25;
    recommendations.push(
      `${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} - prioritize completion`
    );
  }

  // 2. Velocity risk (20% weight) - declining velocity is risky
  const velocity = getVelocityMetrics(projectId, 4);
  if (velocity.length >= 2) {
    const recent = velocity.slice(-2);
    if (recent[1].completed < recent[0].completed * 0.7) {
      factors.velocityRisk = 60;
      riskScore += 60 * 0.2;
      recommendations.push(
        "Velocity declining - review team capacity and blockers"
      );
    } else if (recent[1].trend === "down") {
      factors.velocityRisk = 30;
      riskScore += 30 * 0.2;
    }
  }

  // 3. Blocker risk (15% weight) - tasks stuck in-progress for too long
  const now = Date.now();
  const stuckTasks = tasks.filter((t) => {
    if (t.status !== "in-progress") return false;
    const logs = readTimeLogs().filter((l) => l.taskId === t.id);
    if (logs.length === 0) return true; // no activity
    const lastLog = logs.sort((a, b) => b.loggedAt - a.loggedAt)[0];
    const daysSinceLog = (now - lastLog.loggedAt) / (1000 * 60 * 60 * 24);
    return daysSinceLog > 7; // stuck if no activity for 7 days
  }).length;

  if (stuckTasks > 0) {
    factors.blockerRisk = Math.min(
      100,
      (stuckTasks / Math.max(1, totalTasks)) * 100
    );
    riskScore += factors.blockerRisk * 0.15;
    recommendations.push(
      `${stuckTasks} task${stuckTasks > 1 ? "s" : ""} appear blocked - review progress`
    );
  }

  // 4. Deadline risk (25% weight)
  if (deadline) {
    const daysLeft = Math.ceil(
      (new Date(deadline).getTime() - now) / (1000 * 60 * 60 * 24)
    );
    const completion = getTaskCompletionForProject(projectId);
    const remainingWork = totalTasks - completion.done;

    if (daysLeft < 0) {
      factors.deadlineRisk = 100;
      riskScore += 100 * 0.25;
      recommendations.push("Project overdue - immediate action required");
    } else if (daysLeft <= 3 && completion.percent < 80) {
      factors.deadlineRisk = 80;
      riskScore += 80 * 0.25;
      recommendations.push(
        "Deadline approaching with significant work remaining"
      );
    } else if (daysLeft <= 7 && completion.percent < 70) {
      factors.deadlineRisk = 60;
      riskScore += 60 * 0.25;
      recommendations.push("Consider extending deadline or reducing scope");
    } else if (remainingWork > 0 && daysLeft > 0) {
      const requiredVelocity = remainingWork / daysLeft;
      const recentVelocity =
        velocity.length > 0 ? velocity[velocity.length - 1].avgVelocity : 1;
      if (requiredVelocity > recentVelocity * 1.5) {
        factors.deadlineRisk = 50;
        riskScore += 50 * 0.25;
        recommendations.push("Required velocity exceeds current pace");
      }
    }
  }

  // 5. Estimate accuracy risk (15% weight) - poor estimates increase risk
  const accuracy = getTimeEstimateAccuracy(projectId);
  if (accuracy.tasks.length >= 3) {
    if (accuracy.avgVariance > 40) {
      factors.estimateAccuracyRisk = 70;
      riskScore += 70 * 0.15;
      recommendations.push(
        "Time estimates significantly off - review estimation process"
      );
    } else if (accuracy.avgVariance > 25) {
      factors.estimateAccuracyRisk = 40;
      riskScore += 40 * 0.15;
      recommendations.push("Moderate estimation variance - refine estimates");
    }
  }

  // Determine risk level
  let level: RiskAnalysis["level"];
  if (riskScore >= 70) level = "critical";
  else if (riskScore >= 50) level = "high";
  else if (riskScore >= 30) level = "medium";
  else level = "low";

  if (recommendations.length === 0) {
    recommendations.push("Project tracking well - maintain current velocity");
  }

  return {
    score: parseFloat(riskScore.toFixed(1)),
    level,
    factors,
    recommendations,
  };
}

// ---- Team Analytics Utilities ----

// Member Workload Data
export type MemberWorkload = {
  memberName: string;
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalHours: number;
  estimatedHours: number;
  workloadPercent: number; // relative to team
};

export function getMemberWorkloadStats(projectId?: string): MemberWorkload[] {
  const tasks = projectId ? getTasksByProject(projectId) : readTasks();
  const logs = readTimeLogs();
  const today = new Date().toISOString().slice(0, 10);

  // Group tasks by assignee
  const memberMap = new Map<
    string,
    {
      tasks: TaskItem[];
      logs: TimeLog[];
    }
  >();

  tasks.forEach((task) => {
    const assignee = task.assignee || "Unassigned";
    if (!memberMap.has(assignee)) {
      memberMap.set(assignee, { tasks: [], logs: [] });
    }
    memberMap.get(assignee)!.tasks.push(task);
  });

  // Add time logs
  logs.forEach((log) => {
    const task = tasks.find((t) => t.id === log.taskId);
    if (task) {
      const assignee = task.assignee || "Unassigned";
      if (memberMap.has(assignee)) {
        memberMap.get(assignee)!.logs.push(log);
      }
    }
  });

  // Calculate stats
  const workloads: MemberWorkload[] = [];
  const totalTeamTasks = tasks.length;

  memberMap.forEach((data, memberName) => {
    const totalTasks = data.tasks.length;
    const inProgress = data.tasks.filter(
      (t) => t.status === "in-progress"
    ).length;
    const completed = data.tasks.filter((t) => t.status === "done").length;
    const overdue = data.tasks.filter(
      (t) => t.status !== "done" && t.due && t.due < today
    ).length;

    const totalHours = data.logs.reduce((sum, log) => sum + log.hours, 0);
    const estimatedHours = data.tasks.reduce(
      (sum, t) => sum + (t.estimateHours || 0),
      0
    );
    const workloadPercent =
      totalTeamTasks > 0
        ? parseFloat(((totalTasks / totalTeamTasks) * 100).toFixed(1))
        : 0;

    workloads.push({
      memberName,
      totalTasks,
      inProgress,
      completed,
      overdue,
      totalHours: parseFloat(totalHours.toFixed(1)),
      estimatedHours: parseFloat(estimatedHours.toFixed(1)),
      workloadPercent,
    });
  });

  return workloads.sort((a, b) => b.totalTasks - a.totalTasks);
}

// Individual Contribution Stats
export type ContributionStats = {
  memberName: string;
  tasksCompleted: number;
  timeLogged: number;
  avgTaskTime: number;
  completionRate: number; // percentage of assigned tasks completed
  activeDays: number; // days with activity in last 30 days
  recentActivity: Array<{ date: string; hours: number; tasks: number }>;
};

export function getContributionStats(
  memberName: string,
  days = 30
): ContributionStats {
  const allTasks = readTasks();
  const memberTasks = allTasks.filter((t) => t.assignee === memberName);
  const memberLogs = readTimeLogs().filter((log) => {
    const task = allTasks.find((t) => t.id === log.taskId);
    return task?.assignee === memberName;
  });

  const tasksCompleted = memberTasks.filter((t) => t.status === "done").length;
  const timeLogged = memberLogs.reduce((sum, log) => sum + log.hours, 0);
  const avgTaskTime =
    tasksCompleted > 0
      ? parseFloat((timeLogged / tasksCompleted).toFixed(1))
      : 0;
  const completionRate =
    memberTasks.length > 0
      ? parseFloat(((tasksCompleted / memberTasks.length) * 100).toFixed(1))
      : 0;

  // Calculate activity by day
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentLogs = memberLogs.filter((log) => log.loggedAt >= cutoff);

  const activityMap = new Map<string, { hours: number; tasks: Set<string> }>();
  recentLogs.forEach((log) => {
    const date = new Date(log.loggedAt).toISOString().slice(0, 10);
    if (!activityMap.has(date)) {
      activityMap.set(date, { hours: 0, tasks: new Set() });
    }
    const day = activityMap.get(date)!;
    day.hours += log.hours;
    day.tasks.add(log.taskId);
  });

  const activeDays = activityMap.size;
  const recentActivity = Array.from(activityMap.entries())
    .map(([date, data]) => ({
      date,
      hours: parseFloat(data.hours.toFixed(1)),
      tasks: data.tasks.size,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7); // Last 7 days

  return {
    memberName,
    tasksCompleted,
    timeLogged: parseFloat(timeLogged.toFixed(1)),
    avgTaskTime,
    completionRate,
    activeDays,
    recentActivity,
  };
}

// Activity Heatmap Data
export type ActivityHeatmapData = {
  hour: number; // 0-23
  day: number; // 0-6 (Sun-Sat)
  activity: number; // count of logs
  hours: number; // total hours logged
};

export function getActivityHeatmap(days = 30): ActivityHeatmapData[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const logs = readTimeLogs().filter((log) => log.loggedAt >= cutoff);

  const heatmap = new Map<string, { activity: number; hours: number }>();

  logs.forEach((log) => {
    const date = new Date(log.loggedAt);
    const day = date.getDay(); // 0-6
    const hour = date.getHours(); // 0-23
    const key = `${day}-${hour}`;

    if (!heatmap.has(key)) {
      heatmap.set(key, { activity: 0, hours: 0 });
    }
    const cell = heatmap.get(key)!;
    cell.activity++;
    cell.hours += log.hours;
  });

  const data: ActivityHeatmapData[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const cell = heatmap.get(key) || { activity: 0, hours: 0 };
      data.push({
        hour,
        day,
        activity: cell.activity,
        hours: parseFloat(cell.hours.toFixed(1)),
      });
    }
  }

  return data;
}

// Member Availability
export type MemberAvailability = {
  memberName: string;
  date: string; // YYYY-MM-DD
  status: "available" | "busy" | "off" | "unknown";
  hoursWorked?: number;
  notes?: string;
};

function readAvailability(): MemberAvailability[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:memberAvailability");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAvailability(data: MemberAvailability[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:memberAvailability", JSON.stringify(data));
  } catch {}
}

export function getMemberAvailability(
  memberName: string,
  startDate: string,
  endDate: string
): MemberAvailability[] {
  const all = readAvailability();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return all.filter((a) => {
    if (a.memberName !== memberName) return false;
    const aTime = new Date(a.date).getTime();
    return aTime >= start && aTime <= end;
  });
}

export function setMemberAvailability(
  availability: Omit<MemberAvailability, "hoursWorked">
) {
  const all = readAvailability();
  const idx = all.findIndex(
    (a) =>
      a.memberName === availability.memberName && a.date === availability.date
  );

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...availability };
  } else {
    all.push(availability as MemberAvailability);
  }

  writeAvailability(all);
}

export function getTeamMembers(): string[] {
  const tasks = readTasks();
  const members = new Set<string>();
  tasks.forEach((task) => {
    if (task.assignee) members.add(task.assignee);
  });
  return Array.from(members).sort();
}

// ---- Activity Tracking & Automatic Availability ----
export type MemberActivity = {
  memberName: string;
  lastActive: number; // timestamp
  tasksInProgress: number;
  tasksCompletedToday: number;
  hoursLoggedToday: number;
  currentStatus: "online" | "away" | "offline";
};

function readActivities(): MemberActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:memberActivities");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeActivities(data: MemberActivity[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:memberActivities", JSON.stringify(data));
  } catch {}
}

export function updateMemberActivity(memberName: string) {
  const activities = readActivities();
  const idx = activities.findIndex((a) => a.memberName === memberName);
  const tasks = readTasks();
  const logs = readTimeLogs();

  const tasksInProgress = tasks.filter(
    (t) => t.assignee === memberName && t.status === "in-progress"
  ).length;

  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => {
    const task = tasks.find((t) => t.id === l.taskId);
    return (
      task?.assignee === memberName &&
      new Date(l.loggedAt).toISOString().slice(0, 10) === today
    );
  });

  const tasksCompletedToday = new Set(todayLogs.map((l) => l.taskId)).size;
  const hoursLoggedToday = todayLogs.reduce((sum, l) => sum + l.hours, 0);

  const activity: MemberActivity = {
    memberName,
    lastActive: Date.now(),
    tasksInProgress,
    tasksCompletedToday,
    hoursLoggedToday: parseFloat(hoursLoggedToday.toFixed(1)),
    currentStatus: "online",
  };

  if (idx >= 0) {
    activities[idx] = activity;
  } else {
    activities.push(activity);
  }

  writeActivities(activities);

  // Auto-update availability
  autoUpdateAvailability(memberName, activity);
}

export function getMemberActivity(memberName: string): MemberActivity | null {
  const activities = readActivities();
  const activity = activities.find((a) => a.memberName === memberName);

  // Update status based on time since last active
  if (activity) {
    const timeSinceActive = Date.now() - activity.lastActive;
    const fiveMinutes = 5 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;

    if (timeSinceActive > thirtyMinutes) {
      activity.currentStatus = "offline";
    } else if (timeSinceActive > fiveMinutes) {
      activity.currentStatus = "away";
    } else {
      activity.currentStatus = "online";
    }
  }

  return activity || null;
}

function autoUpdateAvailability(memberName: string, activity: MemberActivity) {
  const today = new Date().toISOString().slice(0, 10);
  const all = readAvailability();
  const existing = all.find(
    (a) => a.memberName === memberName && a.date === today
  );

  // Determine auto status
  let status: MemberAvailability["status"] = "available";
  if (activity.currentStatus === "offline") {
    status = "off";
  } else if (activity.tasksInProgress > 3 || activity.hoursLoggedToday > 6) {
    status = "busy";
  }

  if (existing && existing.notes?.startsWith("[Auto]")) {
    // Update existing auto entry
    existing.status = status;
    existing.hoursWorked = activity.hoursLoggedToday;
  } else if (!existing) {
    // Create new auto entry
    all.push({
      memberName,
      date: today,
      status,
      hoursWorked: activity.hoursLoggedToday,
      notes: "[Auto] Based on activity",
    });
  }
  // Don't overwrite manual entries (without [Auto] prefix)

  writeAvailability(all);
}

export function getAllMemberActivities(): MemberActivity[] {
  const activities = readActivities();
  return activities.map((activity) => {
    const timeSinceActive = Date.now() - activity.lastActive;
    const fiveMinutes = 5 * 60 * 1000;
    const thirtyMinutes = 30 * 60 * 1000;

    if (timeSinceActive > thirtyMinutes) {
      activity.currentStatus = "offline";
    } else if (timeSinceActive > fiveMinutes) {
      activity.currentStatus = "away";
    } else {
      activity.currentStatus = "online";
    }

    return activity;
  });
}

// ---- Chat System ----
export type ChatMessage = {
  id: string;
  fromUser: string;
  toUser: string;
  message: string;
  timestamp: number;
  read: boolean;
};

export type ChatConversation = {
  withUser: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  isOnline: boolean;
};

function readMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:chatMessages");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMessages(data: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:chatMessages", JSON.stringify(data));
  } catch {}
}

export function sendChatMessage(
  fromUser: string,
  toUser: string,
  message: string
): ChatMessage {
  const messages = readMessages();
  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    fromUser,
    toUser,
    message,
    timestamp: Date.now(),
    read: false,
  };
  messages.push(newMessage);
  writeMessages(messages);

  // Update sender's activity
  updateMemberActivity(fromUser);

  return newMessage;
}

export function getChatMessages(user1: string, user2: string): ChatMessage[] {
  const messages = readMessages();
  return messages
    .filter(
      (m) =>
        (m.fromUser === user1 && m.toUser === user2) ||
        (m.fromUser === user2 && m.toUser === user1)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function getChatConversations(currentUser: string): ChatConversation[] {
  const messages = readMessages();
  const conversationMap = new Map<string, ChatConversation>();

  messages.forEach((msg) => {
    const otherUser = msg.fromUser === currentUser ? msg.toUser : msg.fromUser;
    if (msg.fromUser !== currentUser && msg.toUser !== currentUser) return;

    if (!conversationMap.has(otherUser)) {
      const activity = getMemberActivity(otherUser);
      conversationMap.set(otherUser, {
        withUser: otherUser,
        lastMessage: msg.message,
        lastTimestamp: msg.timestamp,
        unreadCount: 0,
        isOnline: activity?.currentStatus === "online",
      });
    }

    const conv = conversationMap.get(otherUser)!;
    if (msg.timestamp > conv.lastTimestamp) {
      conv.lastMessage = msg.message;
      conv.lastTimestamp = msg.timestamp;
    }
    if (msg.toUser === currentUser && !msg.read) {
      conv.unreadCount++;
    }
  });

  return Array.from(conversationMap.values()).sort(
    (a, b) => b.lastTimestamp - a.lastTimestamp
  );
}

export function markMessagesAsRead(currentUser: string, otherUser: string) {
  const messages = readMessages();
  let updated = false;

  messages.forEach((msg) => {
    if (msg.toUser === currentUser && msg.fromUser === otherUser && !msg.read) {
      msg.read = true;
      updated = true;
    }
  });

  if (updated) writeMessages(messages);
}

export function getUnreadMessageCount(currentUser: string): number {
  const messages = readMessages();
  return messages.filter((m) => m.toUser === currentUser && !m.read).length;
}
