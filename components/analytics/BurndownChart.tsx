"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { getBurndownData, type BurndownPoint } from "@/lib/utils";

type BurndownChartProps = {
  projectId: string;
  startDate: string;
  endDate: string;
};

export function BurndownChart({
  projectId,
  startDate,
  endDate,
}: BurndownChartProps) {
  const [data, setData] = React.useState<BurndownPoint[]>([]);

  React.useEffect(() => {
    const points = getBurndownData(projectId, startDate, endDate);
    setData(points);
  }, [projectId, startDate, endDate]);

  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Burndown Chart</h3>
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </Card>
    );
  }

  // Calculate chart dimensions
  const maxValue = Math.max(...data.map((d) => Math.max(d.ideal, d.actual)));
  const chartHeight = 300;
  const chartWidth = 600;
  const padding = { top: 20, right: 40, bottom: 40, left: 50 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => (index / (data.length - 1)) * innerWidth;
  const yScale = (value: number) =>
    innerHeight - (value / maxValue) * innerHeight;

  // Generate path data
  const idealPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.ideal)}`)
    .join(" ");

  const actualPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.actual)}`)
    .join(" ");

  // X-axis labels (show every 7 days or less for smaller ranges)
  const labelInterval = Math.max(1, Math.floor(data.length / 7));
  const xLabels = data.filter(
    (_, i) => i % labelInterval === 0 || i === data.length - 1
  );

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Burndown Chart</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-muted-foreground">Ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary"></div>
              <span className="text-muted-foreground">Actual</span>
            </div>
          </div>
        </div>

        <div className="relative" style={{ height: chartHeight }}>
          <svg
            width={chartWidth}
            height={chartHeight}
            className="overflow-visible"
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = yScale(maxValue * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={0}
                      y1={y}
                      x2={innerWidth}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeDasharray="2,2"
                    />
                    <text
                      x={-10}
                      y={y}
                      textAnchor="end"
                      alignmentBaseline="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      {Math.round(maxValue * ratio)}
                    </text>
                  </g>
                );
              })}

              {/* Ideal line */}
              <path
                d={idealPath}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth={2}
                strokeDasharray="4,4"
              />

              {/* Actual line */}
              <path
                d={actualPath}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                className="stroke-primary"
              />

              {/* Data points on actual line */}
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={xScale(i)}
                  cy={yScale(d.actual)}
                  r={3}
                  className="fill-primary"
                />
              ))}

              {/* X-axis */}
              <line
                x1={0}
                y1={innerHeight}
                x2={innerWidth}
                y2={innerHeight}
                stroke="currentColor"
                strokeOpacity={0.2}
              />

              {/* X-axis labels */}
              {xLabels.map((d, i) => {
                const index = data.indexOf(d);
                return (
                  <text
                    key={index}
                    x={xScale(index)}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {new Date(d.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>
                );
              })}

              {/* Y-axis */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={innerHeight}
                stroke="currentColor"
                strokeOpacity={0.2}
              />
            </g>
          </svg>
        </div>

        {/* Summary stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
            <p className="text-2xl font-bold">{data[0]?.ideal || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">
              {data[data.length - 1]?.completed || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold">
              {data[data.length - 1]?.actual || 0}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
