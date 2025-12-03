"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { getVelocityMetrics, type VelocityData } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type VelocityMetricsProps = {
  projectId: string;
  weeks?: number;
};

export function VelocityMetrics({
  projectId,
  weeks = 8,
}: VelocityMetricsProps) {
  const [data, setData] = React.useState<VelocityData[]>([]);

  React.useEffect(() => {
    const metrics = getVelocityMetrics(projectId, weeks);
    setData(metrics);
  }, [projectId, weeks]);

  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Velocity Metrics</h3>
          <p className="text-sm text-muted-foreground">
            No velocity data available
          </p>
        </div>
      </Card>
    );
  }

  const maxCompleted = Math.max(...data.map((d) => d.completed), 1);
  const avgVelocity =
    data.length > 0
      ? (data.reduce((sum, d) => sum + d.completed, 0) / data.length).toFixed(1)
      : 0;
  const currentVelocity = data[data.length - 1]?.completed || 0;
  const previousVelocity = data[data.length - 2]?.completed || 0;
  const velocityChange =
    previousVelocity > 0
      ? (
          ((currentVelocity - previousVelocity) / previousVelocity) *
          100
        ).toFixed(1)
      : 0;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Velocity Metrics</h3>
          <div className="flex items-center gap-2 text-sm">
            {data[data.length - 1]?.trend === "up" && (
              <>
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  +{velocityChange}%
                </span>
              </>
            )}
            {data[data.length - 1]?.trend === "down" && (
              <>
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  {velocityChange}%
                </span>
              </>
            )}
            {data[data.length - 1]?.trend === "stable" && (
              <>
                <Minus className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Stable</span>
              </>
            )}
          </div>
        </div>

        {/* Bar chart */}
        <div className="space-y-3 mb-6">
          {data.map((week, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{week.period}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{week.completed} tasks</span>
                  <span className="text-xs text-muted-foreground">
                    ({week.points} pts)
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-secondary rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 flex items-center justify-end pr-2"
                  style={{ width: `${(week.completed / maxCompleted) * 100}%` }}
                >
                  {week.completed > 0 && (
                    <span className="text-xs font-medium text-primary-foreground">
                      {week.completed}
                    </span>
                  )}
                </div>
                {/* Average velocity line */}
                <div
                  className="absolute inset-y-0 border-l-2 border-dashed border-blue-500"
                  style={{
                    left: `${(week.avgVelocity / maxCompleted) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Avg Velocity</p>
            <p className="text-2xl font-bold">{avgVelocity}</p>
            <p className="text-xs text-muted-foreground">tasks/week</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Week</p>
            <p className="text-2xl font-bold">{currentVelocity}</p>
            <p className="text-xs text-muted-foreground">tasks</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Completed</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, d) => sum + d.completed, 0)}
            </p>
            <p className="text-xs text-muted-foreground">in {weeks} weeks</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
