"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { loadTasks, type Task } from "@/lib/data";

type CompletionPoint = {
  date: string;
  completed: number;
  pending: number;
  overdue: number;
};
type PriorityPoint = { priority: string; count: number };
type ProductivityPoint = { week: string; [assignee: string]: string | number };

export function TasksCharts() {
  const [completionChartType, setCompletionChartType] =
    useState<ChartType>("area");
  const [priorityChartType, setPriorityChartType] = useState<ChartType>("bar");
  const [productivityChartType, setProductivityChartType] =
    useState<ChartType>("bar");
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    async function fetchChartData() {
      try {
        const res = await fetch("/api/analytics/charts", { cache: "no-store" });
        const result = await res.json();
        if (result.success) {
          setChartData(result.data);
        }
      } catch (error) {
        console.error("Failed to load task chart data:", error);
      }
    }
    fetchChartData();
  }, []);

  const taskCompletionData: CompletionPoint[] = useMemo(() => {
    return chartData?.completionTrend || [];
  }, [chartData]);

  const tasksByPriorityData: PriorityPoint[] = useMemo(() => {
    const counts: Record<string, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    if (chartData?.taskPriority) {
      chartData.taskPriority.forEach((p: any) => {
        const priority = (p.priority || "Medium").toLowerCase();
        const mapped = priority.startsWith("crit")
          ? "Critical"
          : priority.startsWith("high")
            ? "High"
            : priority.startsWith("low")
              ? "Low"
              : "Medium";
        counts[mapped] += p._count;
      });
    }

    return [
      { priority: "Critical", count: counts.Critical },
      { priority: "High", count: counts.High },
      { priority: "Medium", count: counts.Medium },
      { priority: "Low", count: counts.Low },
    ];
  }, [chartData]);

  const teamProductivityData: ProductivityPoint[] = useMemo(() => {
    return chartData?.teamProductivity || [];
  }, [chartData]);

  const renderCompletionChart = () => {
    const commonProps = {
      data: taskCompletionData,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    switch (completionChartType) {
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Area
              type="monotone"
              dataKey="completed"
              stackId="1"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
            <Area
              type="monotone"
              dataKey="pending"
              stackId="1"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorPending)"
            />
            <Area
              type="monotone"
              dataKey="overdue"
              stackId="1"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorOverdue)"
            />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Bar dataKey="completed" fill="#10b981" />
            <Bar dataKey="pending" fill="#f59e0b" />
            <Bar dataKey="overdue" fill="#ef4444" />
          </BarChart>
        );
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Line
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="overdue"
              stroke="#ef4444"
              strokeWidth={2}
            />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const renderPriorityChart = () => {
    switch (priorityChartType) {
      case "bar":
        return (
          <BarChart
            data={tasksByPriorityData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis type="number" stroke="currentColor" opacity={0.6} />
            <YAxis
              dataKey="priority"
              type="category"
              stroke="currentColor"
              opacity={0.6}
            />
            <Tooltip {...chartTooltipStyle} />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        );
      case "line":
        return (
          <LineChart
            data={tasksByPriorityData}
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis type="number" stroke="currentColor" opacity={0.6} />
            <YAxis
              dataKey="priority"
              type="category"
              stroke="currentColor"
              opacity={0.6}
            />
            <Tooltip {...chartTooltipStyle} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart
            data={tasksByPriorityData}
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <defs>
              <linearGradient
                id="colorPriorityCount"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis type="number" stroke="currentColor" opacity={0.6} />
            <YAxis
              dataKey="priority"
              type="category"
              stroke="currentColor"
              opacity={0.6}
            />
            <Tooltip {...chartTooltipStyle} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorPriorityCount)"
            />
          </AreaChart>
        );
      default:
        return null;
    }
  };

  const renderProductivityChart = () => {
    // Extract member names dynamically from data
    const memberNames =
      teamProductivityData.length > 0
        ? Object.keys(teamProductivityData[0]).filter((k) => k !== "week")
        : [];

    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ef4444",
      "#06b6d4",
    ];

    switch (productivityChartType) {
      case "bar":
        return (
          <BarChart data={teamProductivityData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="week" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            {memberNames.map((name, idx) => (
              <Bar
                key={name}
                dataKey={name}
                fill={colors[idx % colors.length]}
              />
            ))}
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={teamProductivityData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="week" stroke="currentColor" opacity={0.6} />
            <YAxis stroke="currentColor" opacity={0.6} />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            {memberNames.map((name, idx) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={teamProductivityData}>
            <defs>
              {memberNames.map((name, idx) => (
                <linearGradient
                  key={name}
                  id={`color${name}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={colors[idx % colors.length]}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={colors[idx % colors.length]}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
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
            {memberNames.map((name, idx) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="1"
                stroke={colors[idx % colors.length]}
                fillOpacity={1}
                fill={`url(#color${name})`}
              />
            ))}
          </AreaChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Task Completion Trend */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Weekly Task Completion
          </h3>
          <ChartTypeSelector
            currentType={completionChartType}
            onTypeChange={setCompletionChartType}
            availableTypes={["area", "bar", "line"]}
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {renderCompletionChart()}
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Priority */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Tasks by Priority
            </h3>
            <ChartTypeSelector
              currentType={priorityChartType}
              onTypeChange={setPriorityChartType}
              availableTypes={["bar", "line", "area"]}
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {renderPriorityChart()}
          </ResponsiveContainer>
        </Card>

        {/* Team Productivity */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Team Productivity (Tasks/Week)
            </h3>
            <ChartTypeSelector
              currentType={productivityChartType}
              onTypeChange={setProductivityChartType}
              availableTypes={["bar", "line", "area"]}
            />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {renderProductivityChart()}
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
