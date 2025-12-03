"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { getTimeEstimateAccuracy } from "@/lib/utils";
import { AlertCircle, CheckCircle, TrendingDown } from "lucide-react";

type TimeEstimateComparisonProps = {
  projectId: string;
};

export function TimeEstimateComparison({
  projectId,
}: TimeEstimateComparisonProps) {
  const [data, setData] = React.useState<ReturnType<
    typeof getTimeEstimateAccuracy
  > | null>(null);

  React.useEffect(() => {
    const accuracy = getTimeEstimateAccuracy(projectId);
    setData(accuracy);
  }, [projectId]);

  if (!data || data.tasks.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Time vs Estimate</h3>
          <p className="text-sm text-muted-foreground">
            No time tracking data available. Tasks need both estimates and
            logged hours.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Time vs Estimate Comparison
        </h3>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Accuracy Rate</p>
            <p className="text-2xl font-bold">{data.accuracyRate}%</p>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Avg Variance</p>
            <p className="text-2xl font-bold">{data.avgVariance}%</p>
          </div>
          <div className="text-center p-3 bg-red-500/10 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 mb-1">
              Over Estimate
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {data.overCount}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
              Under Estimate
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.underCount}
            </p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {data.tasks.map((task) => (
            <div
              key={task.taskId}
              className="p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {task.accuracy === "accurate" && (
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  )}
                  {task.accuracy === "over" && (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  {task.accuracy === "under" && (
                    <TrendingDown className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {task.taskTitle}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    task.accuracy === "over"
                      ? "text-red-600 dark:text-red-400"
                      : task.accuracy === "under"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {task.variance > 0 ? "+" : ""}
                  {task.variance}%
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Est: {task.estimated}h</span>
                <span>Logged: {task.logged}h</span>
                <span>
                  Diff: {Math.abs(task.logged - task.estimated).toFixed(1)}h
                </span>
              </div>

              {/* Visual bar */}
              <div className="mt-2 flex gap-1 h-2">
                <div
                  className="bg-blue-500 rounded"
                  style={{
                    width: `${(task.estimated / Math.max(task.estimated, task.logged)) * 100}%`,
                  }}
                  title={`Estimated: ${task.estimated}h`}
                />
                {task.logged > task.estimated && (
                  <div
                    className="bg-red-500 rounded"
                    style={{
                      width: `${((task.logged - task.estimated) / task.logged) * 100}%`,
                    }}
                    title={`Overtime: ${(task.logged - task.estimated).toFixed(1)}h`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Accurate (±10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-muted-foreground">Over estimate</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">Under estimate</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
