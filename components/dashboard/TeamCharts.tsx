"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
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
import { loadTasks, loadUsers, type Task, type User } from "@/lib/data";

type TeamPoint = {
  month: string;
  active: number;
  inactive: number;
  utilization: number;
};

export function TeamCharts() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [users, setUsers] = useState<User[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    let mounted = true;
    loadUsers().then((u) => mounted && setUsers(u));
    loadTasks().then((t) => mounted && setTasks(t));
    return () => {
      mounted = false;
    };
  }, []);

  const teamMetricsData: TeamPoint[] = useMemo(() => {
    const uCount = (users || []).length;
    const tAll = tasks || [];
    const completed = tAll.filter((t) =>
      ["done", "completed", "complete"].includes((t.status || "").toLowerCase())
    ).length;
    const utilization =
      tAll.length > 0 ? Math.round((completed / tAll.length) * 100) : 0;
    // Build last 6 months labels
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString(undefined, { month: "short" }));
    }
    return months.map((m) => ({
      month: m,
      active: uCount,
      inactive: 0,
      utilization,
    }));
  }, [users, tasks]);

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={teamMetricsData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="month" stroke="currentColor" opacity={0.6} />
            <YAxis yAxisId="left" stroke="currentColor" opacity={0.6} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="currentColor"
              opacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="active"
              fill="#10b981"
              name="Active Members"
            />
            <Bar
              yAxisId="left"
              dataKey="inactive"
              fill="#ef4444"
              name="Inactive Members"
            />
          </BarChart>
        );
      case "line":
        return (
          <LineChart data={teamMetricsData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="month" stroke="currentColor" opacity={0.6} />
            <YAxis yAxisId="left" stroke="currentColor" opacity={0.6} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="currentColor"
              opacity={0.6}
            />
            <Tooltip {...chartTooltipStyle} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="active"
              stroke="#10b981"
              strokeWidth={2}
              name="Active Members"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="inactive"
              stroke="#ef4444"
              strokeWidth={2}
              name="Inactive Members"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Utilization %"
            />
          </LineChart>
        );
      default:
        return (
          <ComposedChart data={teamMetricsData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            <XAxis dataKey="month" stroke="currentColor" opacity={0.6} />
            <YAxis yAxisId="left" stroke="currentColor" opacity={0.6} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="currentColor"
              opacity={0.6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="active"
              fill="#10b981"
              name="Active Members"
            />
            <Bar
              yAxisId="left"
              dataKey="inactive"
              fill="#ef4444"
              name="Inactive Members"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Utilization %"
            />
          </ComposedChart>
        );
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Team Utilization & Capacity
        </h3>
        <ChartTypeSelector
          currentType={chartType}
          onTypeChange={setChartType}
          availableTypes={["bar", "line"]}
        />
      </div>
      <ResponsiveContainer width="100%" height={350}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  );
}
