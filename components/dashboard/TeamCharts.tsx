"use client";
import { useState } from "react";
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

const teamMetricsData = [
  { month: "Jan", active: 15, inactive: 3, utilization: 83 },
  { month: "Feb", active: 17, inactive: 2, utilization: 89 },
  { month: "Mar", active: 19, inactive: 1, utilization: 94 },
  { month: "Apr", active: 20, inactive: 2, utilization: 91 },
  { month: "May", active: 22, inactive: 1, utilization: 95 },
  { month: "Jun", active: 21, inactive: 3, utilization: 87 },
];

export function TeamCharts() {
  const [chartType, setChartType] = useState<ChartType>("bar");

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
