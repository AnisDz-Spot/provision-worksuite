// ---- Project Templates ----

import { getTasksByProject, upsertTask, TaskItem } from "./tasks";
import { getMilestonesByProject, upsertMilestone } from "./milestones";
import { logProjectEvent } from "./project-events";

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
    tags: (project?.tags as string[]) || [],
    projectData: {
      status: "Active",
      priority: project?.priority as "low" | "medium" | "high" | undefined,
      categories: project?.categories as string[] | undefined,
      privacy:
        (project?.privacy as "public" | "team" | "private" | undefined) ||
        "team",
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
