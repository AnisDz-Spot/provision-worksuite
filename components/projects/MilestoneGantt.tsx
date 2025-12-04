"use client";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  Target,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

type Milestone = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  dueDate: string;
  status: "completed" | "in-progress" | "pending";
  progress: number;
  tasks?: { id: string; title: string; completed: boolean }[];
};

type MilestoneGanttProps = {
  milestones?: Milestone[];
};

// Mock milestones for demonstration
const defaultMilestones: Milestone[] = [
  {
    id: "m1",
    title: "Requirements Gathering",
    projectId: "p1",
    projectName: "Project Alpha",
    dueDate: "2025-01-15",
    status: "completed",
    progress: 100,
    tasks: [
      { id: "t1", title: "Stakeholder interviews", completed: true },
      { id: "t2", title: "Document requirements", completed: true },
    ],
  },
  {
    id: "m2",
    title: "Design Phase",
    projectId: "p1",
    projectName: "Project Alpha",
    dueDate: "2025-02-10",
    status: "in-progress",
    progress: 65,
    tasks: [
      { id: "t3", title: "UI mockups", completed: true },
      { id: "t4", title: "UX testing", completed: false },
    ],
  },
  {
    id: "m3",
    title: "Development Sprint 1",
    projectId: "p1",
    projectName: "Project Alpha",
    dueDate: "2025-03-15",
    status: "pending",
    progress: 0,
  },
  {
    id: "m4",
    title: "Beta Launch",
    projectId: "p2",
    projectName: "Project Beta",
    dueDate: "2025-02-20",
    status: "in-progress",
    progress: 40,
  },
  {
    id: "m5",
    title: "Production Deployment",
    projectId: "p2",
    projectName: "Project Beta",
    dueDate: "2025-03-30",
    status: "pending",
    progress: 0,
  },
];

export function MilestoneGantt({
  milestones = defaultMilestones,
}: MilestoneGanttProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );

  const { projectGroups, timeRange } = useMemo(() => {
    // Group milestones by project
    const groups = milestones.reduce(
      (acc, milestone) => {
        if (!acc[milestone.projectId]) {
          acc[milestone.projectId] = {
            projectId: milestone.projectId,
            projectName: milestone.projectName,
            milestones: [],
          };
        }
        acc[milestone.projectId].milestones.push(milestone);
        return acc;
      },
      {} as Record<
        string,
        { projectId: string; projectName: string; milestones: Milestone[] }
      >
    );

    // Calculate time range
    const dates = milestones.map((m) => new Date(m.dueDate).getTime());
    const minDate =
      dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const maxDate =
      dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    // Add padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return {
      projectGroups: Object.values(groups),
      timeRange: { start: minDate, end: maxDate },
    };
  }, [milestones]);

  const totalDays = Math.ceil(
    (timeRange.end.getTime() - timeRange.start.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const today = new Date();
  const todayPosition =
    ((today.getTime() - timeRange.start.getTime()) /
      (1000 * 60 * 60 * 24) /
      totalDays) *
    100;

  const getMilestonePosition = (dueDate: string) => {
    const date = new Date(dueDate);
    const position =
      ((date.getTime() - timeRange.start.getTime()) /
        (1000 * 60 * 60 * 24) /
        totalDays) *
      100;
    return Math.max(0, Math.min(100, position));
  };

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "pending":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Milestone Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Visual Gantt chart of project milestones
          </p>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No milestones found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timeline header */}
          <div className="flex items-center gap-4">
            <div className="w-64 shrink-0" /> {/* Spacer for milestone names */}
            <div className="flex-1 relative">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>
                  {timeRange.start.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>
                  {new Date(
                    (timeRange.start.getTime() + timeRange.end.getTime()) / 2
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>
                  {timeRange.end.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="h-1 bg-accent rounded-full" />
            </div>
          </div>

          {/* Projects and milestones */}
          {projectGroups.map((group) => (
            <div key={group.projectId} className="space-y-2">
              {/* Project header */}
              <button
                onClick={() => toggleProject(group.projectId)}
                className="flex items-center gap-2 w-full text-left hover:bg-accent/50 rounded px-2 py-1 transition-colors"
              >
                {expandedProjects.has(group.projectId) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-semibold text-sm">
                  {group.projectName}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({group.milestones.length} milestones)
                </span>
              </button>

              {/* Milestones */}
              {expandedProjects.has(group.projectId) &&
                group.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-4 group"
                  >
                    {/* Milestone info */}
                    <div className="w-64 shrink-0 px-2">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(milestone.status)}
                        <span className="text-sm font-medium truncate">
                          {milestone.title}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Due:{" "}
                        {new Date(milestone.dueDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </div>
                      {milestone.tasks && (
                        <div className="text-xs text-muted-foreground">
                          {milestone.tasks.filter((t) => t.completed).length}/
                          {milestone.tasks.length} tasks
                        </div>
                      )}
                    </div>

                    {/* Timeline bar */}
                    <div className="flex-1 relative h-8">
                      {/* Today indicator */}
                      {todayPosition >= 0 && todayPosition <= 100 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{ left: `${todayPosition}%` }}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                      )}

                      {/* Milestone marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 transition-all"
                        style={{
                          left: `${getMilestonePosition(milestone.dueDate)}%`,
                        }}
                      >
                        <div
                          className={`w-3 h-3 ${getStatusColor(milestone.status)} rounded-full border-2 border-background shadow-lg group-hover:scale-150 transition-transform`}
                        />

                        {/* Progress bar leading to milestone */}
                        {milestone.progress > 0 && (
                          <div
                            className="absolute right-full top-1/2 -translate-y-1/2 h-1 bg-linear-to-r from-transparent to-current transition-all"
                            style={{
                              width: "60px",
                              color:
                                milestone.status === "completed"
                                  ? "#22c55e"
                                  : "#3b82f6",
                            }}
                          />
                        )}
                      </div>

                      {/* Hover tooltip */}
                      <div
                        className="absolute opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap"
                        style={{
                          left: `${getMilestonePosition(milestone.dueDate)}%`,
                          top: "100%",
                          marginTop: "8px",
                          transform: "translateX(-50%)",
                        }}
                      >
                        <div className="font-semibold">{milestone.title}</div>
                        <div className="text-muted-foreground">
                          {new Date(milestone.dueDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          Progress: {milestone.progress}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span className="text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-0.5 h-4 bg-red-500" />
              <span className="text-muted-foreground">Today</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
