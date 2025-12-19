"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { getMemberWorkloadStats, type MemberWorkload } from "@/lib/utils";
import { Users, TrendingUp, AlertCircle, Clock } from "lucide-react";

type MemberWorkloadViewProps = {
  projectId?: string;
};

export function MemberWorkloadView({ projectId }: MemberWorkloadViewProps) {
  const [workloads, setWorkloads] = React.useState<MemberWorkload[]>([]);

  React.useEffect(() => {
    import("@/lib/dataSource").then(({ shouldUseDatabaseData }) => {
      if (shouldUseDatabaseData()) {
        Promise.all([
          fetch("/api/tasks").then((r) => r.json()),
          fetch("/api/time-logs").then((r) => r.json()),
        ])
          .then(([tasksRes, logsRes]) => {
            const tasks =
              tasksRes.success && tasksRes.data ? tasksRes.data : [];
            const logs =
              logsRes.success && logsRes.data
                ? logsRes.data.map((l: any) => ({
                    taskId: l.task_id,
                    hours: parseFloat(l.hours),
                    loggedAt: new Date(l.date).getTime(),
                  }))
                : [];

            // Map API tasks to TaskItem
            const mappedTasks = tasks.map((t: any) => ({
              id: t.id,
              projectId: t.project_id,
              title: t.title,
              status: t.status,
              assignee: t.assignee_id
                ? t.assignee?.name || "Unknown"
                : "Unassigned", // API returns assignee relation
              due: t.due_date
                ? new Date(t.due_date).toISOString().slice(0, 10)
                : undefined,
              priority: t.priority,
              estimateHours: t.estimated_hours || 0,
            }));

            import("@/lib/utils/team-utilities").then(
              ({ calculateWorkloadStats }) => {
                const stats = calculateWorkloadStats(mappedTasks, logs);
                setWorkloads(stats);
              }
            );
          })
          .catch((err) => console.error("Failed to load workload stats", err));
      } else {
        const stats = getMemberWorkloadStats(projectId);
        setWorkloads(stats);
      }
    });
  }, [projectId]);

  if (workloads.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Member Workload</h3>
          <p className="text-sm text-muted-foreground">
            No team members assigned to tasks
          </p>
        </div>
      </Card>
    );
  }

  const maxTasks = Math.max(...workloads.map((w) => w.totalTasks), 1);
  const maxHours = Math.max(...workloads.map((w) => w.totalHours), 1);

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Member Workload Distribution
          </h3>
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="space-y-4">
          {workloads.map((member, idx) => (
            <div key={idx} className="space-y-2">
              {/* Member Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {member.memberName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.workloadPercent}% of team workload
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {member.totalTasks} tasks
                  </span>
                  <span className="text-muted-foreground">
                    {member.totalHours}h logged
                  </span>
                </div>
              </div>

              {/* Task Breakdown Bar */}
              <div className="flex gap-1 h-8 rounded overflow-hidden bg-secondary">
                {member.completed > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(member.completed / member.totalTasks) * 100}%`,
                    }}
                    title={`${member.completed} completed`}
                  >
                    {member.completed > 0 && member.completed}
                  </div>
                )}
                {member.inProgress > 0 && (
                  <div
                    className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(member.inProgress / member.totalTasks) * 100}%`,
                    }}
                    title={`${member.inProgress} in progress`}
                  >
                    {member.inProgress > 0 && member.inProgress}
                  </div>
                )}
                {member.overdue > 0 && (
                  <div
                    className="bg-red-500 flex items-center justify-center text-xs text-white font-medium"
                    style={{
                      width: `${(member.overdue / member.totalTasks) * 100}%`,
                    }}
                    title={`${member.overdue} overdue`}
                  >
                    {member.overdue > 0 && member.overdue}
                  </div>
                )}
                {member.totalTasks -
                  member.completed -
                  member.inProgress -
                  member.overdue >
                  0 && (
                  <div
                    className="bg-secondary-foreground/20"
                    style={{
                      width: `${((member.totalTasks - member.completed - member.inProgress - member.overdue) / member.totalTasks) * 100}%`,
                    }}
                  />
                )}
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">
                    Done: {member.completed}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">
                    Active: {member.inProgress}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">
                    Overdue: {member.overdue}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {member.totalHours}/{member.estimatedHours}h
                  </span>
                </div>
              </div>

              {/* Workload Alerts */}
              {member.overdue > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 p-2 rounded">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>
                    Has {member.overdue} overdue task
                    {member.overdue > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {member.totalHours > member.estimatedHours * 1.2 && (
                <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 p-2 rounded">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>
                    Time logged exceeds estimates by{" "}
                    {(
                      (member.totalHours / member.estimatedHours - 1) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Team Summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold">{workloads.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">
              {workloads.reduce((sum, w) => sum + w.totalTasks, 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className="text-2xl font-bold">
              {workloads.reduce((sum, w) => sum + w.totalHours, 0).toFixed(1)}h
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
