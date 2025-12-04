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
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    let mounted = true;
    loadTasks().then((t) => {
      if (mounted) setTasks(t);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const taskCompletionData: CompletionPoint[] = useMemo(() => {
    const now = new Date();
    // last 7 days labels ending today
    const days: { key: string; start: Date; end: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const key = start.toLocaleDateString(undefined, { weekday: "short" });
      days.push({ key, start, end });
    }

    const data = days.map((d) => ({
      date: d.key,
      completed: 0,
      pending: 0,
      overdue: 0,
    }));
    const t = tasks || [];
    for (const task of t) {
      const dueRaw = (task as any).due || task.dueDate;
      const due = dueRaw ? new Date(dueRaw) : null;
      const status = (task.status || "").toLowerCase();
      const idx = due
        ? days.findIndex((d) => due >= d.start && due < d.end)
        : -1;
      const isDone = ["done", "completed", "complete"].includes(status);
      if (idx >= 0) {
        if (isDone) data[idx].completed += 1;
        else data[idx].pending += 1;
      } else {
        // If no due date in range, count overdue if past due and not done
        if (due && due < now && !isDone) {
          data[data.length - 1].overdue += 1;
        }
      }
    }
    return data;
  }, [tasks]);

  const tasksByPriorityData: PriorityPoint[] = useMemo(() => {
    const counts: Record<string, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    for (const t of tasks || []) {
      const p = (t.priority || "Medium").toString().toLowerCase();
      const mapped = p.startsWith("crit")
        ? "Critical"
        : p.startsWith("high")
          ? "High"
          : p.startsWith("low")
            ? "Low"
            : "Medium";
      counts[mapped] += 1;
    }
    return [
      { priority: "Critical", count: counts.Critical },
      { priority: "High", count: counts.High },
      { priority: "Medium", count: counts.Medium },
      { priority: "Low", count: counts.Low },
    ];
  }, [tasks]);

  const teamProductivityData: ProductivityPoint[] = useMemo(() => {
    // Build last 6 weeks labels
    const now = new Date();
    const weeks: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      weeks.push(`Wk ${d.getMonth() + 1}/${d.getDate()}`);
    }
    // Count tasks per assignee across the whole period (approximate)
    const assignees = new Map<string, number>();
    for (const t of tasks || []) {
      if (t.assignee)
        assignees.set(t.assignee, (assignees.get(t.assignee) || 0) + 1);
    }
    const top = Array.from(assignees.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name]) => name);
    return weeks.map((w) => {
      const row: ProductivityPoint = { week: w };
      for (const name of top) {
        // Distribute roughly evenly across weeks
        const total = assignees.get(name) || 0;
        row[name] = Math.max(0, Math.round(total / weeks.length));
      }
      return row;
    });
  }, [tasks]);

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
            <Bar dataKey="Alice" fill="#3b82f6" />
            <Bar dataKey="Bob" fill="#10b981" />
            <Bar dataKey="Carol" fill="#f59e0b" />
            <Bar dataKey="David" fill="#8b5cf6" />
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
            <Line
              type="monotone"
              dataKey="Alice"
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Bob"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="Carol"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="David"
              stroke="#8b5cf6"
              strokeWidth={2}
            />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={teamProductivityData}>
            <defs>
              <linearGradient id="colorAlice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorBob" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCarol" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorDavid" x1="0" y1="0" x2="0" y2="1">
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
              dataKey="Alice"
              stackId="1"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorAlice)"
            />
            <Area
              type="monotone"
              dataKey="Bob"
              stackId="1"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorBob)"
            />
            <Area
              type="monotone"
              dataKey="Carol"
              stackId="1"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorCarol)"
            />
            <Area
              type="monotone"
              dataKey="David"
              stackId="1"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorDavid)"
            />
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
