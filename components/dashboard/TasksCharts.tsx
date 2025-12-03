"use client";
import { useState } from "react";
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

const taskCompletionData = [
  { date: "Mon", completed: 12, pending: 8, overdue: 2 },
  { date: "Tue", completed: 15, pending: 6, overdue: 1 },
  { date: "Wed", completed: 18, pending: 5, overdue: 0 },
  { date: "Thu", completed: 14, pending: 7, overdue: 2 },
  { date: "Fri", completed: 20, pending: 4, overdue: 1 },
  { date: "Sat", completed: 8, pending: 12, overdue: 3 },
  { date: "Sun", completed: 5, pending: 15, overdue: 4 },
];

const tasksByPriorityData = [
  { priority: "Critical", count: 8 },
  { priority: "High", count: 15 },
  { priority: "Medium", count: 22 },
  { priority: "Low", count: 18 },
];

const teamProductivityData = [
  { week: "Week 1", Alice: 28, Bob: 25, Carol: 22, David: 20 },
  { week: "Week 2", Alice: 32, Bob: 28, Carol: 26, David: 24 },
  { week: "Week 3", Alice: 35, Bob: 30, Carol: 28, David: 27 },
  { week: "Week 4", Alice: 38, Bob: 35, Carol: 32, David: 30 },
  { week: "Week 5", Alice: 40, Bob: 36, Carol: 34, David: 32 },
  { week: "Week 6", Alice: 42, Bob: 38, Carol: 35, David: 33 },
];

export function TasksCharts() {
  const [completionChartType, setCompletionChartType] =
    useState<ChartType>("area");
  const [priorityChartType, setPriorityChartType] = useState<ChartType>("bar");
  const [productivityChartType, setProductivityChartType] =
    useState<ChartType>("bar");

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
