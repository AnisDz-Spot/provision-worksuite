"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Star, MoreVertical } from "lucide-react";
import { Project } from "./types";
import { useRouter } from "next/navigation";
import {
  calculateProjectHealth,
  getTaskCompletionForProject,
  snapshotHealth,
  getHealthSeries,
} from "@/lib/utils";
import { shouldUseDatabaseData } from "@/lib/dataSource";

interface ProjectCardProps {
  project: Project;
  toggleStar: (id: string) => void;
  onDelete: (project: Project) => void;
  onStatusUpdate: (project: Project, newStatus: Project["status"]) => void;
  onQuickTask: (id: string) => void;
  isDeleting: boolean;
  filesCount: number;
  selectMode: boolean;
  selectedIds: Set<string>;
  onSelect: (id: string, selected: boolean) => void;
  setDeleteConfirm: (confirm: { id: string; name: string } | null) => void;
}

export function ProjectCard({
  project,
  toggleStar,
  onDelete,
  onStatusUpdate,
  onQuickTask,
  filesCount,
  selectMode,
  selectedIds,
  onSelect,
  setDeleteConfirm,
}: ProjectCardProps) {
  const router = useRouter();
  const [completedFlash, setCompletedFlash] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Handle click outside to close menu
  React.useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = () => {
      setMenuOpen(false);
    };
    // Use setTimeout to avoid immediate trigger from the opening click
    const timer = setTimeout(() => {
      window.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  const daysLeft = project.deadline
    ? Math.ceil(
        (new Date(project.deadline).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const health = React.useMemo(
    () => calculateProjectHealth(project),
    [project]
  );
  const taskStats = React.useMemo(() => {
    // If we have API-provided tasks, use them (priority)
    if (project.tasks && project.tasks.length > 0) {
      const total = project.tasks.length;
      const done = project.tasks.filter(
        (t) => t.status === "done" || t.status === "completed"
      ).length;
      return { total, done };
    }

    // In Live Mode (database), if no tasks were returned by the API,
    // we assume there are no tasks. Do NOT fallback to localStorage.
    if (shouldUseDatabaseData()) {
      return { total: 0, done: 0 };
    }

    // In Mock Mode, fallback to localStorage for legacy browser-only demo support
    return getTaskCompletionForProject(project.id);
  }, [project.id, project.tasks]);

  const progress =
    taskStats.total > 0
      ? Math.round((taskStats.done / taskStats.total) * 100)
      : project.status === "Completed"
        ? 100
        : 0;

  // Create health snapshot if healthy
  React.useEffect(() => {
    if (health.score > 80) {
      snapshotHealth(project.id, health.score);
    }
  }, [project.id, health.score]);

  const totalMembers = (project.members || []).length;
  const hasTasks = taskStats.total > 0;

  return (
    <Card className="group relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border overflow-visible">
      {selectMode && (
        <div className="absolute top-2 left-2 z-20">
          <input
            type="checkbox"
            checked={selectedIds.has(project.id)}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(project.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-primary focus:ring-primary"
          />
        </div>
      )}
      <div
        className="cursor-pointer rounded-xl overflow-hidden"
        onClick={() =>
          router.push(`/projects/${project.slug || project.uid || project.id}`)
        }
      >
        {/* Cover Image */}
        <div className="h-32 bg-muted relative overflow-hidden rounded-t-xl">
          {project.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.cover}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/5 to-primary/10">
              <span className="text-4xl font-black text-primary/20 select-none">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-full shadow-xs backdrop-blur-md ${(() => {
                const statusLower = (project.status || "")
                  .toLowerCase()
                  .replace(/\s+/g, "");
                if (statusLower === "active")
                  return "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30";
                if (statusLower === "completed")
                  return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30";
                if (
                  statusLower === "inprogress" ||
                  statusLower === "in_progress"
                )
                  return "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
                if (
                  statusLower === "onhold" ||
                  statusLower === "on_hold" ||
                  statusLower === "paused"
                )
                  return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30";
                if (statusLower === "cancelled")
                  return "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30";
                return "bg-background/80 text-muted-foreground border-muted";
              })()}`}
            >
              {project.status}
            </span>
          </div>

          {/* Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(project.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-md shadow-xs hover:bg-background transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Star
              className={`w-4 h-4 ${project.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Updated {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Delete/Options Menu */}
            <div className="relative flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-8 z-40 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      router.push(
                        `/projects/${project.slug || project.uid || project.id}`
                      );
                    }}
                  >
                    Open
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      setDeleteConfirm({
                        id: project.id,
                        name: project.name,
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {project.tags?.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5"
              >
                #{tag}
              </Badge>
            ))}
            {(project.tags?.length || 0) > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                +{(project.tags?.length || 0) - 3}
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                Progress{" "}
                {hasTasks ? `• ${taskStats.done}/${taskStats.total}` : ""}
              </span>
              <span className="font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-border">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-lg font-bold text-primary">
                {totalMembers}
              </div>
              <div className="text-xs text-muted-foreground">Members</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center border-l border-r border-border">
              <div className="text-lg font-bold text-primary">{filesCount}</div>
              <div className="text-xs text-muted-foreground">Files</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div
                className={`text-sm font-bold truncate ${daysLeft !== null && daysLeft < 7 ? "text-destructive" : "text-foreground"}`}
                title={
                  project.deadline
                    ? new Date(project.deadline).toLocaleDateString()
                    : ""
                }
              >
                {project.deadline
                  ? new Date(project.deadline).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </div>
              <div className="text-xs text-muted-foreground">Due Date</div>
            </div>
          </div>

          {/* Actions & Team */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex -space-x-2 overflow-visible">
              {(project.members || []).slice(0, 4).map((m: any, idx) => {
                const name = m.user?.name || m.name || "Member";
                const avatar = m.user?.avatarUrl || m.avatarUrl;
                const uid = m.user?.uid || m.uid || m.id; // Ensure we have an ID
                return (
                  <div
                    key={idx}
                    className="relative group/avatar cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open member details in Team page using name slug
                      if (name) {
                        const slug = name.toLowerCase().split(" ")[0];
                        router.push(`/team/${slug}`);
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
                      }
                      alt={name}
                      className="w-6 h-6 rounded-full border-2 border-card bg-background hover:scale-110 transition-transform relative z-10"
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {name}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickTask(project.id);
                }}
              >
                + Task
              </Button>
              <Button
                variant={project.status === "Completed" ? "outline" : "primary"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusUpdate(
                    project,
                    project.status === "Completed"
                      ? "Active"
                      : ("Completed" as any)
                  );
                  if (project.status !== "Completed") {
                    setCompletedFlash(true);
                    setTimeout(() => setCompletedFlash(false), 1200);
                  }
                }}
              >
                {project.status === "Completed" ? "Undo" : "Complete"}
              </Button>
            </div>
          </div>
        </div>
        {/* Completed flash overlay */}
        {completedFlash && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-600/10 pointer-events-none">
            <div className="text-green-600 text-4xl font-black">✓</div>
          </div>
        )}
      </div>
    </Card>
  );
}
