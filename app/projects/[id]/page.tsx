"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeftIcon, CalendarDays } from "lucide-react";
import {
  logProjectEvent,
  calculateProjectHealth,
  snapshotHealth,
  getHealthSeries,
  getTaskCompletionForProject,
  getProjectTimeRollup,
  getTasksByProject,
  getTimeLogsForTask,
  saveAsTemplate,
} from "@/lib/utils";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { sanitizeHtml } from "@/lib/sanitize";
import { ProjectMilestones } from "@/components/projects/ProjectMilestones";
import { ProjectComments } from "@/components/projects/ProjectComments";
import { ProjectDependencies } from "@/components/projects/ProjectDependencies";
import { ProjectFiles } from "@/components/projects/ProjectFiles";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { RiskMatrix } from "@/components/projects/RiskMatrix";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useToaster } from "@/components/ui/Toaster";

type Project = {
  id: string;
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string;
  priority?: "low" | "medium" | "high";
  starred?: boolean;
  members?: { name: string; avatarUrl?: string }[];
  cover?: string;
  tags?: string[];
  privacy?: "public" | "team" | "private";
  categories?: string[] | string;
  description?: string;
  isTemplate?: boolean;
};

function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem("pv:projects");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr) && arr.length > 0) {
      const match = arr.find((p: any) => p.id === id);
      if (match) return match;
    }
    // Fallback seed if not found
    const seed: Project[] = [
      {
        id: "p1",
        name: "Project Alpha",
        owner: "Alice",
        status: "Active",
        deadline: "2025-12-11",
        priority: "high",
        starred: true,
        members: [
          { name: "Alice" },
          { name: "Bob" },
          { name: "Carol" },
          { name: "David" },
          { name: "Eve" },
          { name: "Frank" },
        ],
        cover: "",
        tags: ["design", "web"],
        privacy: "team",
        description: "Main dashboard redesign & analytics overhaul.",
      },
      {
        id: "p2",
        name: "Project Beta",
        owner: "Bob",
        status: "Completed",
        deadline: "2025-10-22",
        priority: "medium",
        members: [{ name: "Bob" }, { name: "Alice" }],
        cover: "",
        tags: ["ops"],
        privacy: "team",
        description: "Implement CI/CD pipelines.",
      },
      {
        id: "p3",
        name: "Project Gamma",
        owner: "Carol",
        status: "Paused",
        deadline: "2026-01-19",
        priority: "low",
        starred: false,
        members: [{ name: "Carol" }],
        cover: "",
        tags: [],
        privacy: "private",
        description: "Mobile app initial spike.",
      },
    ];
    return seed.find((p) => p.id === id) || null;
  } catch {
    return null;
  }
}

function loadAllProjects(): Project[] {
  try {
    const raw = localStorage.getItem("pv:projects");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr;
    }
    // Fallback seed
    return [
      {
        id: "p1",
        name: "Project Alpha",
        owner: "Alice",
        status: "Active",
        deadline: "2025-12-11",
        priority: "high",
        starred: true,
        members: [
          { name: "Alice" },
          { name: "Bob" },
          { name: "Carol" },
          { name: "David" },
          { name: "Eve" },
          { name: "Frank" },
        ],
        cover: "",
        tags: ["design", "web"],
        privacy: "team",
        description: "Main dashboard redesign & analytics overhaul.",
      },
      {
        id: "p2",
        name: "Project Beta",
        owner: "Bob",
        status: "Completed",
        deadline: "2025-10-22",
        priority: "medium",
        members: [{ name: "Bob" }, { name: "Alice" }],
        cover: "",
        tags: ["ops"],
        privacy: "team",
        description: "Implement CI/CD pipelines.",
      },
      {
        id: "p3",
        name: "Project Gamma",
        owner: "Carol",
        status: "Paused",
        deadline: "2026-01-19",
        priority: "low",
        starred: false,
        members: [{ name: "Carol" }],
        cover: "",
        tags: [],
        privacy: "private",
        description: "Mobile app initial spike.",
      },
    ];
  } catch {
    return [];
  }
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { show } = useToaster();
  const projectId = params.id as string;
  const [project, setProject] = React.useState<Project | null>(null);
  const [allProjects, setAllProjects] = React.useState<Project[]>([]);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const tasksRef = React.useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [templateModalOpen, setTemplateModalOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  const [templateDesc, setTemplateDesc] = React.useState("");
  const [templateCategory, setTemplateCategory] = React.useState("Other");

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (data.success && data.project) {
          // Normalize members for the UI
          const p = data.project;
          // Map Prisma members to UI members
          if (p.members) {
            p.members = p.members.map((m: any) => ({
              uid: m.user?.uid,
              name: m.user?.name || m.name || "Member",
              avatarUrl: m.user?.avatarUrl || m.avatarUrl,
            }));
          }
          setProject(p);
        } else {
          setProject(null);
        }
      } catch (err) {
        console.error(err);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (isLoading) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center justify-center py-20">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground border-t-transparent"
            aria-label="Loading"
          />
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project not found
          </h1>
        </div>
      </section>
    );
  }

  const members = project.members || [];
  const tags = project.tags || [];
  const categories = Array.isArray(project.categories)
    ? project.categories
    : (project.categories || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8">
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </Link>

      <Card>
        <div className="h-56 bg-muted relative">
          {project.cover ? (
            <Image
              src={project.cover}
              alt={project.name}
              width={1200}
              height={224}
              className="w-full h-56 object-cover"
            />
          ) : (
            <div className="w-full h-56 flex items-center justify-center text-muted-foreground">
              No thumbnail
            </div>
          )}
          {(project as any).client && (
            <div className="absolute top-4 right-4 flex items-center gap-3 bg-card/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-lg border border-border">
              {(project as any).clientLogo && (
                <Image
                  src={(project as any).clientLogo}
                  alt={(project as any).client}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded object-cover"
                />
              )}
              <span className="text-lg font-bold text-foreground">
                {(project as any).client}
              </span>
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {project.name}
                  </h1>
                  {(() => {
                    const today = new Date();
                    const deadline = new Date(project.deadline);
                    const daysLeft = Math.ceil(
                      (deadline.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    let color = "text-green-600 dark:text-green-400";
                    let bgColor = "bg-green-100 dark:bg-green-900/30";
                    if (daysLeft < 0) {
                      color = "text-red-600 dark:text-red-400";
                      bgColor = "bg-red-100 dark:bg-red-900/30";
                    } else if (daysLeft <= 7) {
                      color = "text-orange-600 dark:text-orange-400";
                      bgColor = "bg-orange-100 dark:bg-orange-900/30";
                    } else if (daysLeft <= 14) {
                      color = "text-amber-600 dark:text-amber-400";
                      bgColor = "bg-amber-100 dark:bg-amber-900/30";
                    }
                    return (
                      <div
                        className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md ${bgColor} ${color} font-semibold text-base w-fit`}
                      >
                        <CalendarDays className="w-4 h-4" />
                        <span>
                          Due:{" "}
                          {project.deadline
                            ? new Date(project.deadline)
                                .toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                                .replace(/\//g, "-")
                            : "—"}
                        </span>
                        {daysLeft >= 0 && (
                          <span className="text-sm">
                            ({daysLeft} {daysLeft === 1 ? "day" : "days"} left)
                          </span>
                        )}
                        {daysLeft < 0 && (
                          <span className="text-sm">
                            ({Math.abs(daysLeft)}{" "}
                            {Math.abs(daysLeft) === 1 ? "day" : "days"} overdue)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTemplateName(project.name + " Template");
                      setTemplateDesc("");
                      setTemplateModalOpen(true);
                    }}
                  >
                    Save as Template
                  </Button>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button
                      variant="outline"
                      size="md"
                      className="whitespace-nowrap"
                    >
                      Edit Project
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    project.status === "Active"
                      ? "info"
                      : project.status === "Completed"
                        ? "success"
                        : "warning"
                  }
                  pill
                >
                  {project.status}
                </Badge>
                {project.priority && (
                  <Badge
                    variant={
                      project.priority === "high"
                        ? "warning"
                        : project.priority === "medium"
                          ? "info"
                          : "secondary"
                    }
                    pill
                  >
                    {project.priority}
                  </Badge>
                )}
                {project.privacy && (
                  <Badge variant="secondary" pill>
                    {project.privacy}
                  </Badge>
                )}
                {project.isTemplate && (
                  <Badge variant="info" pill>
                    Template
                  </Badge>
                )}
                {(project as any).budget && (
                  <Badge variant="info" pill>
                    Budget: ${(project as any).budget}
                  </Badge>
                )}
                {(project as any).sla && (
                  <Badge variant="info" pill>
                    <abbr
                      className="border-b border-dashed border-current no-underline cursor-help"
                      title="Service Level Agreement"
                    >
                      SLA
                    </abbr>
                    : {(project as any).sla}d
                  </Badge>
                )}
              </div>

              {/* Health Score with popover and history */}
              {(() => {
                const health = calculateProjectHealth({
                  id: project.id,
                  deadline: project.deadline,
                  status: project.status,
                });
                try {
                  snapshotHealth(project.id, health.score);
                } catch {}
                return (
                  <div className="flex items-center gap-4">
                    <div
                      className={`group relative flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        health.status === "excellent"
                          ? "bg-green-100 text-green-700"
                          : health.status === "good"
                            ? "bg-blue-100 text-blue-700"
                            : health.status === "warning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          health.status === "excellent"
                            ? "bg-green-600"
                            : health.status === "good"
                              ? "bg-blue-600"
                              : health.status === "warning"
                                ? "bg-amber-600"
                                : "bg-red-600"
                        }`}
                      />
                      {health.score}/100 • {health.status.toUpperCase()}
                      {/* Popover */}
                      <div className="absolute top-8 left-0 z-20 hidden group-hover:block">
                        <div className="w-80 bg-card border border-border rounded-md shadow-lg p-3 text-xs">
                          <div className="font-semibold mb-2">
                            Health Breakdown
                          </div>
                          <div className="grid grid-cols-2 gap-y-1">
                            <span className="text-muted-foreground">
                              Deadline
                            </span>
                            <span className="text-right">
                              {health.factors.deadline}%
                            </span>
                            <span className="text-muted-foreground">
                              Activity
                            </span>
                            <span className="text-right">
                              {health.factors.activity}%
                            </span>
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-right">
                              {health.factors.completion}%
                            </span>
                            <span className="text-muted-foreground">
                              Dependencies
                            </span>
                            <span className="text-right">
                              {health.factors.dependencies}%
                            </span>
                          </div>
                          <div className="mt-3">
                            <svg viewBox="0 0 120 24" className="w-full h-6">
                              {(() => {
                                const series = getHealthSeries(project.id, 14);
                                const max = 100,
                                  min = 0;
                                const points = series
                                  .map((v, i) => {
                                    const x = (i / (series.length - 1)) * 120;
                                    const y =
                                      24 - ((v - min) / (max - min)) * 24;
                                    return `${x},${y}`;
                                  })
                                  .join(" ");
                                return (
                                  <polyline
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1"
                                    points={points}
                                  />
                                );
                              })()}
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHistoryOpen(true)}
                    >
                      View history
                    </Button>
                  </div>
                );
              })()}

              {/* Time Rollup */}
              {(() => {
                const r = getProjectTimeRollup(project.id);
                return (
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <Badge variant="secondary" pill>
                      Est: {r.estimate}h
                    </Badge>
                    <Badge variant="info" pill>
                      Logged: {r.logged}h
                    </Badge>
                    <Badge variant="warning" pill>
                      Remaining: {r.remaining}h
                    </Badge>
                  </div>
                );
              })()}

              {project.description && (
                <Card className="p-6 bg-linear-to-br from-card to-accent/5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-primary rounded-full"></div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                      Project Description
                    </h3>
                  </div>
                  <div
                    className="text-sm text-foreground/90 prose prose-sm max-w-none leading-relaxed pl-3"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(project.description),
                    }}
                  />
                </Card>
              )}

              {/* Milestones */}
              <ProjectMilestones projectId={project.id} />

              {/* Comments */}
              <ProjectComments projectId={project.id} />

              {/* Dependencies */}
              <ProjectDependencies
                projectId={project.id}
                availableProjects={allProjects}
              />

              {/* Files */}
              <ProjectFiles projectId={project.id} />
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 sticky top-4 self-start">
              {/* Recent Time Logs Ticker */}
              {(() => {
                const tasks = getTasksByProject(project.id);
                if (tasks.length === 0) return null;
                const titleMap = new Map(tasks.map((t) => [t.id, t.title]));
                const allLogs = tasks.flatMap((t) => getTimeLogsForTask(t.id));
                const recent = allLogs
                  .sort((a, b) => b.loggedAt - a.loggedAt)
                  .slice(0, 12);
                if (recent.length === 0) return null;
                const items = recent.map(
                  (l) =>
                    `${l.hours}h • ${titleMap.get(l.taskId) || "Task"} • ${l.loggedBy || "Unknown"} • ${new Date(l.loggedAt).toLocaleString()}`
                );
                return (
                  <Card className="p-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-accent/30">
                      <h3 className="text-sm font-semibold">
                        Recent Time Logs
                      </h3>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        auto-scroll
                      </span>
                    </div>
                    <div className="relative h-12 overflow-hidden bg-card flex items-center px-4">
                      <div
                        className="absolute inset-0 pointer-events-none bg-linear-to-r from-card via-transparent to-card z-10"
                        style={{
                          maskImage:
                            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
                        }}
                      />
                      <div
                        className="flex items-center gap-6 whitespace-nowrap will-change-transform ticker-track"
                        style={{
                          animation: "pv-marquee 40s linear infinite" as any,
                        }}
                      >
                        {[...items, ...items].map((text, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-medium text-foreground/80 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            {text}
                          </span>
                        ))}
                      </div>
                    </div>
                    <style jsx>{`
                      @keyframes pv-marquee {
                        0% {
                          transform: translateX(0);
                        }
                        100% {
                          transform: translateX(-50%);
                        }
                      }
                      .ticker-track {
                        display: flex;
                        align-items: center;
                      }
                      .ticker-track:hover {
                        animation-play-state: paused;
                      }
                    `}</style>
                  </Card>
                );
              })()}

              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">Team Members</h3>
                <div className="space-y-2">
                  {members.slice(0, 8).map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Image
                        src={
                          m.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
                        }
                        alt={m.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform"
                        title={m.name}
                        onClick={() =>
                          router.push(
                            `/team/${m.name.toLowerCase().replace(/\s+/g, "-")}`
                          )
                        }
                      />
                      <button
                        className="text-sm hover:underline cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/team/${m.name.toLowerCase().replace(/\s+/g, "-")}`
                          )
                        }
                      >
                        {m.name}
                      </button>
                    </div>
                  ))}
                  {members.length > 8 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      +{members.length - 8} more members
                    </div>
                  )}
                </div>
              </Card>

              {categories.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c, i) => (
                      <Badge key={i} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {tags.length > 0 && (
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t, i) => (
                      <Badge key={i} variant="secondary">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3">
                  Activity Timeline
                </h3>
                <div className="text-xs text-muted-foreground">
                  <ProjectTimeline projectId={project.id} compact />
                </div>
              </Card>
            </div>
          </div>

          {/* Tasks (Kanban) - Full Width */}
          <div className="mt-6" ref={tasksRef}>
            <h3 className="text-sm font-semibold mb-2">Tasks</h3>
            <KanbanBoard
              projectId={project.id}
              projectMembers={members}
              onTaskUpdate={() => setRefreshKey((k) => k + 1)}
            />
          </div>

          {/* Risk Management Matrix */}
          <div className="mt-6">
            <RiskMatrix projectId={project.id} projectName={project.name} />
          </div>

          {/* Recent Time Logs */}
          {(() => {
            const tasks = getTasksByProject(project.id);
            if (tasks.length === 0) return null;
            const titleMap = new Map(tasks.map((t) => [t.id, t.title]));
            const allLogs = tasks.flatMap((t) => getTimeLogsForTask(t.id));
            const recent = allLogs
              .sort((a, b) => b.loggedAt - a.loggedAt)
              .slice(0, 10);
            if (recent.length === 0) return null;
            return (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Recent Time Logs</h3>
                <div className="space-y-1">
                  {recent.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between text-xs border border-border rounded px-2 py-1.5 bg-card/50 gap-2"
                    >
                      <span
                        className="font-medium truncate max-w-[30%]"
                        title={titleMap.get(l.taskId) || "Task"}
                      >
                        {titleMap.get(l.taskId) || "Task"}
                      </span>
                      <span
                        className="text-muted-foreground truncate max-w-[25%]"
                        title={l.loggedBy || "Unknown"}
                      >
                        {l.loggedBy || "Unknown"}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                        {new Date(l.loggedAt).toLocaleDateString()}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded bg-background/60 font-semibold shrink-0"
                        title={`${l.hours} hours`}
                      >
                        {l.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Floating Tasks Icon */}
      <button
        onClick={() =>
          tasksRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        className="fixed bottom-4 right-20 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title="Jump to Tasks"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </button>

      {/* Health History Drawer */}
      <Modal open={historyOpen} onOpenChange={setHistoryOpen} size="lg">
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Project Health History</h3>

          {/* Current Health Summary */}
          {(() => {
            const health = calculateProjectHealth({
              id: project.id,
              deadline: project.deadline,
              status: project.status,
            });
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <div className="text-xs text-muted-foreground mb-1">
                    Overall Score
                  </div>
                  <div className="text-2xl font-bold">{health.score}/100</div>
                </div>
                <div className="p-3 rounded-lg bg-accent/20">
                  <div className="text-xs text-muted-foreground mb-1">
                    Deadline
                  </div>
                  <div className="text-2xl font-bold">
                    {health.factors.deadline}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/20">
                  <div className="text-xs text-muted-foreground mb-1">
                    Activity
                  </div>
                  <div className="text-2xl font-bold">
                    {health.factors.activity}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/20">
                  <div className="text-xs text-muted-foreground mb-1">
                    Progress
                  </div>
                  <div className="text-2xl font-bold">
                    {health.factors.completion}%
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 30-Day Trend Chart */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">30-Day Health Trend</h4>
            <div className="p-6 border rounded-lg bg-linear-to-br from-card to-accent/5">
              <svg viewBox="0 0 300 80" className="w-full h-20">
                {(() => {
                  const series = getHealthSeries(project.id, 30);
                  const max = 100,
                    min = 0;
                  const pts = series
                    .map((v, i) => {
                      const x = (i / (series.length - 1)) * 300;
                      const y = 80 - ((v - min) / (max - min)) * 80;
                      return `${x},${y}`;
                    })
                    .join(" ");
                  return (
                    <>
                      {/* Grid lines */}
                      <line
                        x1="0"
                        y1="20"
                        x2="300"
                        y2="20"
                        stroke="currentColor"
                        strokeOpacity="0.1"
                      />
                      <line
                        x1="0"
                        y1="40"
                        x2="300"
                        y2="40"
                        stroke="currentColor"
                        strokeOpacity="0.1"
                      />
                      <line
                        x1="0"
                        y1="60"
                        x2="300"
                        y2="60"
                        stroke="currentColor"
                        strokeOpacity="0.1"
                      />
                      {/* Trend line */}
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        points={pts}
                      />
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const series = getHealthSeries(project.id, 30);
                const avg = Math.round(
                  series.reduce((a, b) => a + b, 0) / series.length
                );
                const maxScore = Math.max(...series);
                const minScore = Math.min(...series);
                return (
                  <>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">
                        Average
                      </div>
                      <div className="text-lg font-bold">{avg}</div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">Peak</div>
                      <div className="text-lg font-bold text-green-600">
                        {maxScore}
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <div className="text-xs text-muted-foreground">
                        Lowest
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        {minScore}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setHistoryOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save as Template Modal */}
      <Modal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        size="md"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Save as Template</h3>
            <p className="text-sm text-muted-foreground">
              Create a reusable template from this project
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Template Name
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Describe this template..."
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value)}
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              >
                <option value="Software Development">
                  Software Development
                </option>
                <option value="Marketing">Marketing</option>
                <option value="Business">Business</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="p-4 rounded-lg bg-accent/20 space-y-2 text-sm">
              <div className="font-medium">Template will include:</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• All tasks ({getTasksByProject(project.id).length})</li>
                <li>• Project settings and configuration</li>
                <li>• Tags and categories</li>
                <li>• Task structure and priorities</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setTemplateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!templateName.trim()) return;
                try {
                  saveAsTemplate(
                    templateName.trim(),
                    templateDesc.trim(),
                    templateCategory,
                    project.id
                  );
                  setTemplateModalOpen(false);
                  show("success", "Template saved successfully");
                  router.push("/templates");
                } catch (err) {
                  show("error", "Failed to save template");
                }
              }}
              disabled={!templateName.trim()}
            >
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
