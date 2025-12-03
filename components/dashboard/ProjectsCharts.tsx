"use client";
import { useState } from "react";
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

const projectsTimelineData = [
  { week: "Week 1", active: 5, completed: 2, planning: 3 },
  { week: "Week 2", active: 7, completed: 4, planning: 2 },
  { week: "Week 3", active: 9, completed: 6, planning: 1 },
  { week: "Week 4", active: 12, completed: 8, planning: 2 },
  { week: "Week 5", active: 10, completed: 7, planning: 3 },
  { week: "Week 6", active: 11, completed: 9, planning: 1 },
];

const projectStatusData = [
  { name: "Active", value: 11, color: "#3b82f6" },
  { name: "Completed", value: 9, color: "#10b981" },
  { name: "Paused", value: 3, color: "#f59e0b" },
  { name: "Planning", value: 1, color: "#8b5cf6" },
];

const projectHealthData = [
  { name: "Project Alpha", health: 85, progress: 70 },
  { name: "Project Beta", health: 100, progress: 100 },
  { name: "Project Gamma", health: 65, progress: 45 },
  { name: "Project Delta", health: 78, progress: 55 },
  { name: "Project Epsilon", health: 92, progress: 80 },
  { name: "Project Zeta", health: 88, progress: 75 },
];

export function ProjectsCharts() {
  const [timelineChartType, setTimelineChartType] = useState<ChartType>("line");
  const [statusChartType, setStatusChartType] = useState<ChartType>("pie");
  const [healthChartType, setHealthChartType] = useState<ChartType>("bar");

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
