"use client";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { ChartTypeSelector, type ChartType } from "./ChartTypeSelector";
import { chartTooltipStyle } from "@/lib/chart-utils";
import { loadProjects, type Project } from "@/lib/data";

type TimelinePoint = {
  week: string;
  active: number;
  completed: number;
  planning: number;
};
type StatusPoint = { name: string; value: number; color: string };
type HealthPoint = { name: string; health: number; progress: number };

export function ProjectsCharts() {
  const [timelineChartType, setTimelineChartType] = useState<ChartType>("line");
  const [statusChartType, setStatusChartType] = useState<ChartType>("pie");
  const [healthChartType, setHealthChartType] = useState<ChartType>("bar");
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    let mounted = true;
    loadProjects().then((p) => {
      if (mounted) setProjects(p);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const projectStatusData: StatusPoint[] = useMemo(() => {
    const p = projects || [];
    const counts: Record<string, number> = {
      Active: 0,
      Completed: 0,
      Paused: 0,
      "In Progress": 0,
    };
    for (const pr of p) {
      const s = pr.status as string;
      if (s in counts) counts[s] += 1;
      else counts["In Progress"] += 1;
    }
    return [
      { name: "Active", value: counts["Active"], color: "#3b82f6" },
      { name: "Completed", value: counts["Completed"], color: "#10b981" },
      { name: "Paused", value: counts["Paused"], color: "#f59e0b" },
      { name: "In Progress", value: counts["In Progress"], color: "#8b5cf6" },
    ];
  }, [projects]);

  const projectsTimelineData: TimelinePoint[] = useMemo(() => {
    // Build last 6 weeks labels
    const labels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const week = `${d.getMonth() + 1}/${d.getDate()}`;
      labels.push(week);
    }
    // Simple approach: reflect overall status counts across weeks (flat trend but DB-driven)
    const base = projectStatusData.reduce(
      (acc, cur) => {
        if (cur.name === "Active") acc.active = cur.value;
        if (cur.name === "Completed") acc.completed = cur.value;
        if (cur.name === "In Progress") acc.planning = cur.value;
        return acc;
      },
      { active: 0, completed: 0, planning: 0 }
    );
    return labels.map((week) => ({ week, ...base }));
  }, [projectStatusData]);

  const projectHealthData: HealthPoint[] = useMemo(() => {
    const p = projects || [];
    // Map each project to a health/progress tuple
    return p.slice(0, 12).map((pr) => {
      const progress =
        typeof pr.progress === "number"
          ? Math.max(0, Math.min(100, pr.progress))
          : 0;
      // Basic health heuristic: progress with slight deadline pressure penalty if overdue
      let health = progress;
      const deadline = pr.deadline ? new Date(pr.deadline) : null;
      if (deadline && deadline.getTime() < Date.now() && progress < 100) {
        health = Math.max(0, progress - 20);
      }
      return { name: pr.name, health, progress };
    });
  }, [projects]);

  const renderTimelineChart = () => {
    const commonProps = {
      data: projectsTimelineData,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    switch (timelineChartType) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="week" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="planning"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          </LineChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="week" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Bar dataKey="active" fill="#3b82f6" />
            <Bar dataKey="completed" fill="#10b981" />
            <Bar dataKey="planning" fill="#8b5cf6" />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPlanning" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="week" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Area
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorActive)"
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
            <Area
              type="monotone"
              dataKey="planning"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorPlanning)"
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  const renderStatusChart = () => {
    switch (statusChartType) {
      case "pie":
        return (
          <PieChart>
            <Pie
              data={projectStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {projectStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...chartTooltipStyle} />
          </PieChart>
        );
      case "bar":
        return (
          <BarChart
            data={projectStatusData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="name" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="value" fill="#3b82f6">
              {projectStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        );
      case "line":
        return (
          <LineChart
            data={projectStatusData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="name" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const renderHealthChart = () => {
    switch (healthChartType) {
      case "bar":
        return (
          <BarChart data={projectHealthData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="currentColor"
              opacity={0.6}
            />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Bar dataKey="health" fill="#3b82f6" />
            <Bar dataKey="progress" fill="#10b981" />
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={projectHealthData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="currentColor"
              opacity={0.6}
            />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Line
              type="monotone"
              dataKey="health"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#10b981"
              strokeWidth={2}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={projectHealthData}>
            <defs>
              <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="currentColor"
              opacity={0.6}
            />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Area
              type="monotone"
              dataKey="health"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorHealth)"
            />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorProgress)"
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Projects Timeline */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Projects Timeline (Last 6 Weeks)
          </h3>
          <ChartTypeSelector
            currentType={timelineChartType}
            onTypeChange={setTimelineChartType}
            availableTypes={["line", "bar", "area"]}
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {renderTimelineChart()}
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Project Status Distribution
            </h3>
            <ChartTypeSelector
              currentType={statusChartType}
              onTypeChange={setStatusChartType}
              availableTypes={["pie", "bar", "line"]}
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {renderStatusChart()}
          </ResponsiveContainer>
        </Card>

        {/* Project Health Score */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Project Health Scores
            </h3>
            <ChartTypeSelector
              currentType={healthChartType}
              onTypeChange={setHealthChartType}
              availableTypes={["bar", "line", "area"]}
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {renderHealthChart()}
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
