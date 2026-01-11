"use client";

import React, { useMemo } from "react";
import { Project } from "@/lib/data";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Heart,
} from "lucide-react";
import {
  calculateProjectHealth,
  getHealthColor,
  getHealthLabel,
  type HealthLevel,
} from "@/lib/project-health";
import { getTaskCompletionForProject } from "@/lib/utils";

interface ProjectStatsProps {
  projects: Project[];
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  // Helpers
  const isStatus = (status: string | undefined, ...checks: string[]) => {
    const s = (status || "").toLowerCase().replace(/_/g, " ");
    return checks.some((c) => s === c.toLowerCase());
  };

  // 1. Active Projects
  const activeProjects = projects.filter((p) =>
    isStatus(p.status, "active", "in progress")
  );

  // Calculate average progress of active projects
  const activeProgressSum = activeProjects.reduce(
    (sum, p) => sum + (p.progress || 0),
    0
  );
  const avgActiveProgress =
    activeProjects.length > 0
      ? Math.round(activeProgressSum / activeProjects.length)
      : 0;

  // On track calculation (mock logic: projects with progress matching time elapsed?)
  // For now, let's say "On track" if progress >= 50% or if no deadline passed.
  const onTrackCount = activeProjects.filter(
    (p) => !p.deadline || new Date(p.deadline) > new Date()
  ).length;
  const onTrackParams =
    activeProjects.length > 0
      ? Math.round((onTrackCount / activeProjects.length) * 100)
      : 100;

  // 2. Completed Projects
  const completedProjects = projects.filter((p) =>
    isStatus(p.status, "completed", "done")
  );

  // Monthly Trend for Completed
  const currentMonth = new Date().getMonth();
  const completedThisMonth = completedProjects.filter((p) => {
    // We need a completedAt date, but we might only have endDate or updatedAt or just createdAt.
    // Fallback to endDate if available, else assume recently completed if status is done?
    // Actually we don't track completedAt strictly in the Project interface yet.
    // Let's use endDate if present, else fallback to check if it's generally recent.
    // For robust data, we'll assume endDate is the completion date.
    if (!p.endDate) return false;
    return new Date(p.endDate).getMonth() === currentMonth;
  }).length;

  const monthName = new Date().toLocaleString("default", { month: "short" });

  // Progress Ring Component (internal)
  const ProgressRing = ({
    percentage,
    colorClass,
  }: {
    percentage: number;
    colorClass: string;
  }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-accent"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className={colorClass}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colorClass}`}
        >
          {percentage}%
        </div>
      </div>
    );
  };

  // 3. Paused / Attention Needed
  const pausedProjects = projects.filter((p) =>
    isStatus(p.status, "paused", "on hold", "blocked")
  );

  // 4. Health Score Calculation
  const healthScores = useMemo(() => {
    return projects.map((project) => {
      const taskCompletion = getTaskCompletionForProject(project.id);
      const progress = taskCompletion?.percent || project.progress || 0;

      return {
        projectId: project.id,
        health: calculateProjectHealth({
          progress,
          deadline: project.deadline,
          status: project.status,
          // Add more data as available
        }),
      };
    });
  }, [projects]);

  // Group by health level
  const healthyProjects = healthScores.filter(
    (h) => h.health.level === "healthy"
  ).length;
  const warningProjects = healthScores.filter(
    (h) => h.health.level === "warning"
  ).length;
  const atRiskProjects = healthScores.filter(
    (h) => h.health.level === "at-risk"
  ).length;
  const criticalProjects = healthScores.filter(
    (h) => h.health.level === "critical"
  ).length;

  // Average health score
  const avgHealthScore =
    projects.length > 0
      ? Math.round(
          healthScores.reduce((sum, h) => sum + h.health.score, 0) /
            projects.length
        )
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Completed Projects Card */}
      <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
        <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Completed
              </p>
              <p className="text-4xl font-bold text-green-600">
                {completedProjects.length}
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+{completedThisMonth} this month</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          {/* Mini bar chart (Visual only, relative to max 10 for scale) */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground w-8">
                {monthName}
              </div>
              <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{
                    width: `${Math.min((completedThisMonth / (completedProjects.length || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Projects Card */}
      <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
        <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Active
              </p>
              <p className="text-4xl font-bold text-blue-600">
                {activeProjects.length}
              </p>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>{onTrackParams}% On track</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          {/* Mini progress rings */}
          <div className="flex items-center gap-3">
            <ProgressRing
              percentage={avgActiveProgress}
              colorClass="text-blue-500"
            />
            <div className="text-xs text-muted-foreground">Avg progress</div>
          </div>
        </div>
      </Card>

      {/* Paused Projects Card */}
      <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
        <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Paused
              </p>
              <p className="text-4xl font-bold text-amber-600">
                {pausedProjects.length}
              </p>
              <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                <AlertCircle className="w-3 h-3" />
                <span>Needs attention</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          {/* Status list */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="text-xs text-muted-foreground">
                {
                  pausedProjects.filter((p) => isStatus(p.status, "paused"))
                    .length
                }{" "}
                Paused
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="text-xs text-muted-foreground">
                {
                  pausedProjects.filter((p) => isStatus(p.status, "blocked"))
                    .length
                }{" "}
                Blocked
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Health Overview Card */}
      <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
        {(() => {
          const avgLevel: HealthLevel =
            avgHealthScore >= 80
              ? "healthy"
              : avgHealthScore >= 60
                ? "warning"
                : avgHealthScore >= 40
                  ? "at-risk"
                  : "critical";
          const hColor = getHealthColor(avgLevel);

          return (
            <>
              <div
                className={`absolute inset-0 bg-linear-to-br ${hColor.bg} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Health Score
                    </p>
                    <p className={`text-4xl font-bold ${hColor.text}`}>
                      {avgHealthScore}
                    </p>
                    <div
                      className={`flex items-center gap-1 text-xs ${hColor.text} mt-1`}
                    >
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{getHealthLabel(avgLevel)} avg</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${hColor.bg}`}>
                    <Heart className={`w-8 h-8 ${hColor.text}`} />
                  </div>
                </div>

                {/* Health breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="text-xs text-muted-foreground flex-1">
                      Healthy
                    </div>
                    <div className="text-xs font-semibold">
                      {healthyProjects}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="text-xs text-muted-foreground flex-1">
                      Warning
                    </div>
                    <div className="text-xs font-semibold">
                      {warningProjects}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <div className="text-xs text-muted-foreground flex-1">
                      At Risk
                    </div>
                    <div className="text-xs font-semibold">
                      {atRiskProjects}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="text-xs text-muted-foreground flex-1">
                      Critical
                    </div>
                    <div className="text-xs font-semibold">
                      {criticalProjects}
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </Card>
    </div>
  );
}
