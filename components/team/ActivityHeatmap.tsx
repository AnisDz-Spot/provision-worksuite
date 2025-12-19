"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { getActivityHeatmap, type ActivityHeatmapData } from "@/lib/utils";
import { Activity } from "lucide-react";

type ActivityHeatmapProps = {
  days?: number;
};

export function ActivityHeatmap({ days = 30 }: ActivityHeatmapProps) {
  const [data, setData] = React.useState<ActivityHeatmapData[]>([]);

  React.useEffect(() => {
    const heatmapData = getActivityHeatmap(days);
    setData(heatmapData);
  }, [days]);

  const maxActivity = Math.max(...data.map((d) => d.activity), 1);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hourLabels = Array.from({ length: 24 }, (_, i) => i);

  const getIntensityColor = (activity: number) => {
    if (activity === 0) return "bg-secondary";
    const intensity = activity / maxActivity;
    if (intensity > 0.75) return "bg-primary";
    if (intensity > 0.5) return "bg-primary/70";
    if (intensity > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  const getCellData = (day: number, hour: number) => {
    return (
      data.find((d) => d.day === day && d.hour === hour) || {
        activity: 0,
        hours: 0,
        day,
        hour,
      }
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Heatmap</h3>
          <p className="text-sm text-muted-foreground">
            No activity data available
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Team Activity Heatmap</h3>
          <Activity className="w-5 h-5 text-muted-foreground" />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Activity patterns over the last {days} days (darker = more active)
        </p>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-12 shrink-0" /> {/* Space for day labels */}
              {hourLabels.map((hour) => (
                <div
                  key={hour}
                  className="w-6 text-xs text-center text-muted-foreground"
                  title={`${hour}:00`}
                >
                  {hour % 3 === 0 ? hour : ""}
                </div>
              ))}
            </div>

            {dayLabels.map((dayLabel, dayIdx) => (
              <div key={dayIdx} className="flex items-center mb-1 gap-1">
                <div className="w-12 text-xs text-muted-foreground shrink-0">
                  {dayLabel}
                </div>
                {hourLabels.map((hour) => {
                  const cell = getCellData(dayIdx, hour);
                  return (
                    <div
                      key={hour}
                      className={`w-6 h-6 rounded-sm ${getIntensityColor(cell.activity)} transition-colors cursor-pointer hover:ring-2 hover:ring-primary`}
                      title={`${dayLabel} ${hour}:00 - ${cell.activity} activities, ${cell.hours}h logged`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Activity Level</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-secondary" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/70" />
                <div className="w-4 h-4 rounded-sm bg-primary" />
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>

        {/* Peak Activity Insights */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {(() => {
            // Find peak hour
            const hourActivity = new Map<number, number>();
            data.forEach((d) => {
              hourActivity.set(
                d.hour,
                (hourActivity.get(d.hour) || 0) + d.activity
              );
            });
            const peakHour = Array.from(hourActivity.entries()).sort(
              (a, b) => b[1] - a[1]
            )[0];

            // Find peak day
            const dayActivity = new Map<number, number>();
            data.forEach((d) => {
              dayActivity.set(
                d.day,
                (dayActivity.get(d.day) || 0) + d.activity
              );
            });
            const peakDay = Array.from(dayActivity.entries()).sort(
              (a, b) => b[1] - a[1]
            )[0];

            return (
              <>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Most Active Hour
                  </p>
                  <p className="text-lg font-bold">
                    {peakHour
                      ? `${peakHour[0]}:00 - ${peakHour[0] + 1}:00`
                      : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Most Active Day
                  </p>
                  <p className="text-lg font-bold">
                    {peakDay ? dayLabels[peakDay[0]] : "N/A"}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </Card>
  );
}
