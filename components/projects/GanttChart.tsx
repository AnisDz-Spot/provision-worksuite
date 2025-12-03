"use client";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  status: string;
  deadline?: string;
  owner: string;
};

interface GanttChartProps {
  projects: Project[];
  dependencies: { projectId: string; dependsOn: string[] }[];
}

export function GanttChart({ projects, dependencies }: GanttChartProps) {
  const router = useRouter();
  const [viewDate, setViewDate] = React.useState(new Date());
  const [hoveredProject, setHoveredProject] = React.useState<string | null>(
    null
  );

  // Calculate view range (show 3 months)
  const startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 3, 0);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Generate weeks for header
  const weeks: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  const getProjectPosition = (project: Project) => {
    if (!project.deadline) return null;

    const projectEnd = new Date(project.deadline);
    // Estimate start date as 30 days before deadline (or project creation)
    const projectStart = new Date(projectEnd);
    projectStart.setDate(projectStart.getDate() - 30);

    const startOffset = Math.max(
      0,
      (projectStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const endOffset =
      (projectEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, ((endOffset - startOffset) / totalDays) * 100);

    return { left, width, startOffset, endOffset };
  };

  const getDependencyLines = (projectId: string) => {
    const dep = dependencies.find((d) => d.projectId === projectId);
    if (!dep || dep.dependsOn.length === 0) return [];

    return dep.dependsOn
      .map((depId) => {
        const sourceProject = projects.find((p) => p.id === depId);
        if (!sourceProject) return null;
        return { sourceId: depId, sourceName: sourceProject.name };
      })
      .filter(Boolean);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setViewDate(newDate);
  };

  const today = new Date();
  const todayOffset =
    ((today.getTime() - startDate.getTime()) /
      (1000 * 60 * 60 * 24) /
      totalDays) *
    100;
  const showToday = todayOffset >= 0 && todayOffset <= 100;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Gantt Timeline</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {startDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}{" "}
            -{" "}
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewDate(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        {/* Header */}
        <div className="bg-accent/30 border-b overflow-hidden">
          <div className="flex">
            <div className="w-48 p-3 border-r font-semibold text-sm">
              Project
            </div>
            <div className="flex-1 relative">
              <div className="flex">
                {weeks.map((week, idx) => (
                  <div
                    key={idx}
                    className="flex-1 p-2 text-xs text-center border-l first:border-l-0 text-muted-foreground"
                  >
                    {week.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="divide-y">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No projects with deadlines to display
            </div>
          ) : (
            projects.map((project) => {
              const position = getProjectPosition(project);
              const deps = getDependencyLines(project.id);
              const isHovered = hoveredProject === project.id;

              return (
                <div
                  key={project.id}
                  className="flex hover:bg-accent/20 transition-colors relative"
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  <div
                    className="w-48 p-3 border-r cursor-pointer hover:bg-accent/40 transition-colors"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="text-sm font-medium truncate">
                      {project.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {project.owner}
                    </div>
                    {deps.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Circle className="w-2 h-2" />
                        {deps.length} dep{deps.length > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    {/* Today indicator */}
                    {showToday && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                        style={{ left: `${todayOffset}%` }}
                      >
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    )}

                    {/* Project bar */}
                    {position && (
                      <div className="relative">
                        {/* Dependency indicators */}
                        {deps.map((dep, idx) => {
                          const depProject = projects.find(
                            (p) => p.id === dep?.sourceId
                          );
                          const depPos = depProject
                            ? getProjectPosition(depProject)
                            : null;
                          if (!depPos) return null;

                          return (
                            <div
                              key={idx}
                              className="absolute h-0.5 bg-muted-foreground/30"
                              style={{
                                left: `${depPos.left + depPos.width}%`,
                                width: `${Math.max(0, position.left - (depPos.left + depPos.width))}%`,
                                top: "50%",
                              }}
                            />
                          );
                        })}

                        {/* Main bar */}
                        <div
                          className={`absolute h-8 rounded-md transition-all cursor-pointer group ${
                            project.status === "Completed"
                              ? "bg-green-500"
                              : project.status === "Active"
                                ? "bg-blue-500"
                                : project.status === "In Progress"
                                  ? "bg-amber-500"
                                  : "bg-gray-400"
                          } ${isHovered ? "shadow-lg scale-105 z-20" : "shadow"}`}
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            top: "4px",
                          }}
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div className="px-2 py-1 text-white text-xs font-medium truncate h-full flex items-center">
                            {project.name}
                          </div>
                          {isHovered && (
                            <div className="absolute left-0 top-full mt-2 bg-card border-2 border-primary rounded-lg p-3 shadow-2xl z-50 min-w-[250px] text-xs">
                              <div className="font-semibold mb-2 text-base">
                                {project.name}
                              </div>
                              <div className="space-y-1">
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    Owner:
                                  </span>{" "}
                                  {project.owner}
                                </div>
                                <div className="text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    Status:
                                  </span>{" "}
                                  {project.status}
                                </div>
                                {project.deadline && (
                                  <div className="text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      Due:
                                    </span>{" "}
                                    {new Date(
                                      project.deadline
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              {deps.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <div className="font-medium mb-1 text-foreground">
                                    Depends on:
                                  </div>
                                  {deps.map((dep, idx) => (
                                    <div
                                      key={idx}
                                      className="text-muted-foreground text-xs"
                                    >
                                      • {dep?.sourceName}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-400" />
          <span>Paused</span>
        </div>
        {showToday && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-0.5 h-4 bg-red-500" />
            <span>Today</span>
          </div>
        )}
      </div>
    </Card>
  );
}
