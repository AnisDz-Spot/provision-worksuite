"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import {
  getContributionStats,
  getTeamMembers,
  type ContributionStats,
} from "@/lib/utils";
import { User, Clock, CheckCircle, Calendar, TrendingUp } from "lucide-react";

export function IndividualContributionStats() {
  const [members, setMembers] = React.useState<string[]>([]);
  const [selectedMember, setSelectedMember] = React.useState<string>("");
  const [stats, setStats] = React.useState<ContributionStats | null>(null);

  React.useEffect(() => {
    const teamMembers = getTeamMembers();
    setMembers(teamMembers);
    if (teamMembers.length > 0 && !selectedMember) {
      setSelectedMember(teamMembers[0]);
    }
  }, [selectedMember]);

  React.useEffect(() => {
    if (selectedMember) {
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

              const mappedTasks = tasks.map((t: any) => ({
                id: t.id,
                projectId: t.project_id,
                title: t.title,
                status: t.status,
                assignee: t.assignee_id
                  ? t.assignee?.name || "Unknown"
                  : "Unassigned",
                due: t.due_date
                  ? new Date(t.due_date).toISOString().slice(0, 10)
                  : undefined,
                priority: t.priority,
                estimateHours: t.estimated_hours || 0,
              }));

              import("@/lib/utils/team-utilities").then(
                ({ calculateContributionStats }) => {
                  const contributionStats = calculateContributionStats(
                    selectedMember,
                    mappedTasks,
                    logs,
                    30
                  );
                  setStats(contributionStats);
                }
              );
            })
            .catch((err) =>
              console.error("Failed to load contribution stats", err)
            );
        } else {
          const contributionStats = getContributionStats(selectedMember, 30);
          setStats(contributionStats);
        }
      });
    }
  }, [selectedMember]);

  if (members.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Individual Contributions
          </h3>
          <p className="text-sm text-muted-foreground">No team members found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Individual Contribution Stats
          </h3>
          <User className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Member Selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Select Member
          </label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full px-3 py-2 bg-secondary rounded border border-border text-sm"
          >
            {members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </div>

        {stats && (
          <>
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
              </div>

              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Hours Logged</p>
                </div>
                <p className="text-2xl font-bold">{stats.timeLogged}h</p>
              </div>

              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">
                    Completion Rate
                  </p>
                </div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>

              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <p className="text-xs text-muted-foreground">Active Days</p>
                </div>
                <p className="text-2xl font-bold">{stats.activeDays}</p>
                <p className="text-xs text-muted-foreground">in last 30d</p>
              </div>
            </div>

            {/* Average Task Time */}
            <div className="mb-6 p-4 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-2">Average Time per Task</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{stats.avgTaskTime}h</p>
                <p className="text-sm text-muted-foreground">
                  ({stats.timeLogged}h total / {stats.tasksCompleted} tasks)
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <p className="text-sm font-medium mb-3">
                Recent Activity (Last 7 Days)
              </p>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded hover:bg-secondary transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium">
                          {new Date(activity.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.tasks} task{activity.tasks > 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {activity.hours}h
                        </div>
                        <div className="w-20 h-2 bg-primary/20 rounded overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(100, (activity.hours / 8) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent activity recorded
                </p>
              )}
            </div>

            {/* Performance Indicators */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-3">Performance Indicators</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-secondary rounded overflow-hidden">
                      <div
                        className={`h-full ${
                          stats.completionRate >= 80
                            ? "bg-green-500"
                            : stats.completionRate >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Activity Level</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-secondary rounded overflow-hidden">
                      <div
                        className={`h-full ${
                          stats.activeDays >= 20
                            ? "bg-green-500"
                            : stats.activeDays >= 10
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${(stats.activeDays / 30) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">
                      {stats.activeDays}/30
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
