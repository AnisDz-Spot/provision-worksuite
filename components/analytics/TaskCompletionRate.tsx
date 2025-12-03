"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { getCompletionRateStats, type CompletionStats } from "@/lib/utils";

type TaskCompletionRateProps = {
  projectId: string;
  days?: number;
};

export function TaskCompletionRate({
  projectId,
  days = 30,
}: TaskCompletionRateProps) {
  const [data, setData] = React.useState<CompletionStats[]>([]);
  const [view, setView] = React.useState<"daily" | "weekly">("weekly");

  React.useEffect(() => {
    const stats = getCompletionRateStats(projectId, days);
    setData(stats);
  }, [projectId, days]);

  // Aggregate data by week for weekly view
  const weeklyData = React.useMemo(() => {
    if (view !== "weekly" || data.length === 0) return [];

    const weeks: CompletionStats[] = [];
    for (let i = 0; i < data.length; i += 7) {
      const weekData = data.slice(i, i + 7);
      const weekCompleted = weekData.reduce((sum, d) => sum + d.completed, 0);
      const weekTotal = weekData[0]?.total || 0;

      weeks.push({
        date: weekData[0].date,
        completed: weekCompleted,
        total: weekTotal,
        rate:
          weekTotal > 0
            ? parseFloat(((weekCompleted / weekTotal) * 100).toFixed(1))
            : 0,
      });
    }
    return weeks;
  }, [data, view]);

  const displayData = view === "weekly" ? weeklyData : data;
  const maxCompleted = Math.max(...displayData.map((d) => d.completed), 1);

  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Task Completion Rate</h3>
          <p className="text-sm text-muted-foreground">
            No completion data available
          </p>
        </div>
      </Card>
    );
  }

  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
  const avgDaily = (totalCompleted / data.length).toFixed(1);
  const last7Days = data.slice(-7).reduce((sum, d) => sum + d.completed, 0);

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Task Completion Rate</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setView("daily")}
              className={`px-3 py-1 text-sm rounded transition ${
                view === "daily"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setView("weekly")}
              className={`px-3 py-1 text-sm rounded transition ${
                view === "weekly"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
          {displayData.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {view === "weekly"
                    ? `Week of ${new Date(stat.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : new Date(stat.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                </span>
                <span className="font-medium">{stat.completed} tasks</span>
              </div>
              <div className="relative h-6 bg-secondary rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-linear-to-r from-primary to-primary/70 transition-all duration-300"
                  style={{ width: `${(stat.completed / maxCompleted) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">in {days} days</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Daily</p>
            <p className="text-2xl font-bold">{avgDaily}</p>
            <p className="text-xs text-muted-foreground">tasks/day</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last 7 Days</p>
            <p className="text-2xl font-bold">{last7Days}</p>
            <p className="text-xs text-muted-foreground">tasks</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
