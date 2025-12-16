"use client";

import React from "react";
import { BurndownChart } from "@/components/analytics/BurndownChart";
import { VelocityMetrics } from "@/components/analytics/VelocityMetrics";
import { TaskCompletionRate } from "@/components/analytics/TaskCompletionRate";
import { TimeEstimateComparison } from "@/components/analytics/TimeEstimateComparison";
import { RiskScore } from "@/components/analytics/RiskScore";
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Activity,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToaster } from "@/components/ui/Toaster";
import {
  getBurndownData,
  getVelocityMetrics,
  getCompletionRateStats,
  getTimeEstimateAccuracy,
  calculateRiskScore,
} from "@/lib/utils";
import { log } from "@/lib/logger";

type Project = {
  id: string;
  name: string;
  deadline?: string;
};

export default function AnalyticsPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [dateRange, setDateRange] = React.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });
  const toaster = useToaster();

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("pv:projects");
      const projectsList = raw ? JSON.parse(raw) : [];
      setProjects(projectsList);
      if (projectsList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch {}
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const exportAnalyticsReport = () => {
    if (!selectedProjectId || !selectedProject) {
      toaster.show("error", "Please select a project first");
      return;
    }

    try {
      // Gather all analytics data
      const burndownData = getBurndownData(
        selectedProjectId,
        dateRange.start,
        dateRange.end
      );
      const velocityData = getVelocityMetrics(selectedProjectId, 8);
      const completionData = getCompletionRateStats(selectedProjectId, 30);
      const timeAccuracy = getTimeEstimateAccuracy(selectedProjectId);
      const riskAnalysis = calculateRiskScore(
        selectedProjectId,
        selectedProject.deadline
      );

      // Create report object
      const report = {
        project: {
          id: selectedProject.id,
          name: selectedProject.name,
          deadline: selectedProject.deadline,
        },
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: dateRange.start,
          end: dateRange.end,
        },
        analytics: {
          burndown: burndownData,
          velocity: velocityData,
          completion: completionData,
          timeEstimateAccuracy: timeAccuracy,
          riskScore: riskAnalysis,
        },
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedProject.name.replace(/\s+/g, "-")}-analytics-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toaster.show("success", "Analytics report exported successfully");
    } catch (error) {
      log.error({ err: error }, "Export error");
      toaster.show("error", "Failed to export analytics report");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Project Analytics</h1>
              <p className="text-muted-foreground">
                Track performance, velocity, and risks across your projects
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                Project:
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 bg-secondary rounded text-sm border border-border min-w-[200px]"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                From:
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="px-3 py-1.5 bg-secondary rounded text-sm border border-border"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                To:
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="px-3 py-1.5 bg-secondary rounded text-sm border border-border"
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => {
                const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 10);
                const end = new Date().toISOString().slice(0, 10);
                setDateRange({ start, end });
              }}
            >
              Last 30 Days
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {!selectedProjectId ? (
          <div className="text-center py-20">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-muted-foreground">
              Select a project from the dropdown above to view analytics
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Burndown</p>
                  <p className="text-lg font-bold">Tracking</p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Velocity</p>
                  <p className="text-lg font-bold">Metrics</p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <p className="text-lg font-bold">Rate</p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time vs</p>
                  <p className="text-lg font-bold">Estimate</p>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className="text-lg font-bold">Score</p>
                </div>
              </div>
            </div>

            {/* Risk Score - Full Width */}
            <RiskScore
              projectId={selectedProjectId}
              deadline={selectedProject?.deadline}
            />

            {/* Burndown and Velocity Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BurndownChart
                projectId={selectedProjectId}
                startDate={dateRange.start}
                endDate={dateRange.end}
              />
              <VelocityMetrics projectId={selectedProjectId} weeks={8} />
            </div>

            {/* Completion Rate and Time Estimate Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TaskCompletionRate projectId={selectedProjectId} days={30} />
              <TimeEstimateComparison projectId={selectedProjectId} />
            </div>

            {/* Export/Actions */}
            <div className="flex justify-center pt-6 border-t">
              <Button variant="secondary" onClick={exportAnalyticsReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Analytics Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
