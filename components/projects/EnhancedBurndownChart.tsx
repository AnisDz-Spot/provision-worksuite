"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBurndownData, type BurndownPoint } from "@/lib/utils";
import { Calendar, TrendingDown, AlertTriangle, Download } from "lucide-react";

type EnhancedBurndownChartProps = {
  projectId: string;
  projectName?: string;
  compareProjects?: Array<{ id: string; name: string; color: string }>;
};

export function EnhancedBurndownChart({
  projectId,
  projectName,
  compareProjects = [],
}: EnhancedBurndownChartProps) {
  // Default to last 30 days
  const defaultEnd = new Date();
  const defaultStart = new Date(
    defaultEnd.getTime() - 30 * 24 * 60 * 60 * 1000
  );

  const [startDate, setStartDate] = useState(
    defaultStart.toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().slice(0, 10));
  const [showIdeal, setShowIdeal] = useState(true);
  const [showComparison, setShowComparison] = useState(true);
  const [scopeMarkers, setScopeMarkers] = useState<
    Array<{ date: string; note: string }>
  >([]);
  const [newMarkerDate, setNewMarkerDate] = useState<string>("");
  const [newMarkerNote, setNewMarkerNote] = useState<string>("");
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  // Load and persist scope markers per project
  useEffect(() => {
    const key = `burndown:scopeMarkers:${projectId}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setScopeMarkers(parsed);
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    const key = `burndown:scopeMarkers:${projectId}`;
    try {
      localStorage.setItem(key, JSON.stringify(scopeMarkers));
    } catch {}
  }, [projectId, scopeMarkers]);

  const data = useMemo(() => {
    return getBurndownData(projectId, startDate, endDate);
  }, [projectId, startDate, endDate]);

  const comparisonData = useMemo(() => {
    if (!showComparison || compareProjects.length === 0) return [];
    return compareProjects.map((proj) => ({
      ...proj,
      data: getBurndownData(proj.id, startDate, endDate),
    }));
  }, [compareProjects, startDate, endDate, showComparison]);

  const stats = useMemo(() => {
    if (data.length === 0) return null;

    const initial = data[0].ideal;
    const current = data[data.length - 1].actual;
    const completed = data[data.length - 1].completed || 0;
    const progress =
      initial > 0 ? ((completed / initial) * 100).toFixed(1) : "0";

    // Calculate velocity (tasks per day)
    const daysElapsed = data.length;
    const velocity =
      daysElapsed > 0 ? (completed / daysElapsed).toFixed(2) : "0";

    // Trend analysis
    const recentData = data.slice(-7);
    const recentCompleted = recentData.reduce(
      (sum, d) => sum + (d.completed || 0),
      0
    );
    const trend = recentCompleted > 0 ? "improving" : "stagnant";

    // Check if ahead or behind
    const idealRemaining = data[data.length - 1].ideal;
    const status =
      current < idealRemaining
        ? "ahead"
        : current > idealRemaining
          ? "behind"
          : "on-track";

    return { initial, current, completed, progress, velocity, trend, status };
  }, [data]);

  const exportData = () => {
    const csv = [
      ["Date", "Ideal", "Actual", "Completed"],
      ...data.map((d) => [d.date, d.ideal, d.actual, d.completed || 0]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `burndown_${projectId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Burndown Chart</h3>
            <p className="text-sm text-muted-foreground">
              No data available for selected range
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>
    );
  }

  // Calculate chart dimensions
  const maxValue = Math.max(...data.map((d) => Math.max(d.ideal, d.actual)), 1);
  const chartHeight = 320;
  const chartWidth = 700;
  const padding = { top: 20, right: 50, bottom: 50, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) =>
    (index / Math.max(1, data.length - 1)) * innerWidth;
  const yScale = (value: number) =>
    innerHeight - (value / maxValue) * innerHeight;

  // Generate path data
  const idealPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.ideal)}`)
    .join(" ");

  const actualPath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.actual)}`)
    .join(" ");

  // Area fill for actual
  const actualArea = `${actualPath} L ${xScale(data.length - 1)} ${innerHeight} L 0 ${innerHeight} Z`;

  // X-axis labels
  const labelInterval = Math.max(1, Math.floor(data.length / 8));
  const xLabels = data.filter(
    (_, i) => i % labelInterval === 0 || i === data.length - 1
  );

  // Helpers for marker rendering
  const dateToIndex = (dateStr: string) => {
    // Normalize the input date to YYYY-MM-DD format
    const targetDate = dateStr.slice(0, 10);

    // Find the index where the date matches
    const idx = data.findIndex((d) => {
      const pointDate = d.date.slice(0, 10);
      return pointDate === targetDate;
    });

    // If exact match not found, find the closest date within range
    if (idx === -1) {
      const target = new Date(targetDate).getTime();
      let closestIdx = -1;
      let closestDiff = Infinity;

      data.forEach((d, i) => {
        const pointTime = new Date(d.date.slice(0, 10)).getTime();
        const diff = Math.abs(pointTime - target);
        if (diff < closestDiff && diff < 24 * 60 * 60 * 1000) {
          // Within 1 day
          closestDiff = diff;
          closestIdx = i;
        }
      });

      return closestIdx >= 0 ? closestIdx : null;
    }

    return idx;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Burndown Chart</h3>
            <p className="text-sm text-muted-foreground">
              {projectName || `Project ${projectId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIdeal(!showIdeal)}
          >
            <Calendar className="w-4 h-4 mr-1" />
            {showIdeal ? "Hide" : "Show"} Ideal
          </Button>
          {compareProjects.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? "Hide" : "Show"} Comparison
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground block mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Scope Markers Controls */}
      <div className="mb-4 p-3 rounded-lg border bg-muted/20">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">
              Marker Date
            </label>
            <Input
              type="date"
              value={newMarkerDate}
              onChange={(e) => setNewMarkerDate(e.target.value)}
            />
          </div>
          <div className="flex-2">
            <label className="text-xs text-muted-foreground block mb-1">
              Note
            </label>
            <Input
              type="text"
              placeholder="e.g., Scope +15 tasks"
              value={newMarkerNote}
              onChange={(e) => setNewMarkerNote(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!newMarkerDate) return;
              const idx = dateToIndex(newMarkerDate);
              if (idx === null) {
                // Show error feedback
                alert(
                  "Selected date is outside the chart range. Please select a date within the displayed timeframe."
                );
                return;
              }
              const next = [
                ...scopeMarkers,
                {
                  date: newMarkerDate.slice(0, 10),
                  note: newMarkerNote.trim(),
                },
              ];
              setScopeMarkers(next);
              setNewMarkerDate("");
              setNewMarkerNote("");

              // Visual feedback - temporary highlight
              const markerElements = document.querySelectorAll(
                "[data-marker-highlight]"
              );
              markerElements.forEach((el) => el.classList.add("animate-pulse"));
              setTimeout(() => {
                markerElements.forEach((el) =>
                  el.classList.remove("animate-pulse")
                );
              }, 1000);
            }}
          >
            Add Marker
          </Button>
          {scopeMarkers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScopeMarkers([])}
            >
              Clear
            </Button>
          )}
        </div>
        {scopeMarkers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scopeMarkers.map((m, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded bg-amber-500/15 text-amber-700 border border-amber-500/30"
              >
                {new Date(m.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                : {m.note || "Scope change"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status Banner */}
      {stats && stats.status !== "on-track" && (
        <div
          className={`mb-4 p-3 rounded-lg border flex items-center gap-2 text-sm ${
            stats.status === "ahead"
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
              : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
          }`}
        >
          {stats.status === "ahead" ? (
            <>✓ Project is ahead of schedule</>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              Project is behind schedule - consider adding resources
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
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

            {/* Area fill for actual progress */}
            <path
              d={actualArea}
              fill="currentColor"
              fillOpacity={0.1}
              className="fill-primary"
            />

            {/* Ideal line */}
            {showIdeal && (
              <path
                d={idealPath}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth={2}
                strokeDasharray="5,5"
                opacity={0.6}
              />
            )}

            {/* Actual line */}
            <path
              d={actualPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              className="stroke-primary"
            />

            {/* Comparison project lines */}
            {showComparison &&
              comparisonData.map((proj, idx) => {
                if (proj.data.length === 0) return null;
                const compPath = proj.data
                  .map((d, i) => {
                    const x = xScale(i);
                    const y = yScale(d.actual);
                    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                  })
                  .join(" ");

                return (
                  <g key={proj.id}>
                    <path
                      d={compPath}
                      fill="none"
                      stroke={proj.color}
                      strokeWidth={2}
                      strokeDasharray="3,3"
                      opacity={0.7}
                    />
                    {proj.data.map((d, i) => (
                      <circle
                        key={i}
                        cx={xScale(i)}
                        cy={yScale(d.actual)}
                        r={2.5}
                        fill={proj.color}
                        opacity={0.7}
                      />
                    ))}
                  </g>
                );
              })}

            {/* Data points on actual line */}
            {data.map((d, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(d.actual)}
                r={3.5}
                className="fill-primary stroke-background"
                strokeWidth={2}
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

            {/* Scope Markers Rendering */}
            {scopeMarkers.map((m, i) => {
              const idx = dateToIndex(m.date);
              if (idx === null) return null;
              const x = xScale(idx);
              return (
                <g
                  key={`${m.date}-${i}`}
                  onMouseEnter={() => setHoveredMarker(i)}
                  onMouseLeave={() => setHoveredMarker(null)}
                >
                  <title>
                    {m.note ? m.note : "Scope change"} —{" "}
                    {new Date(m.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </title>
                  {/* vertical line */}
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={innerHeight}
                    stroke="rgb(245, 158, 11)"
                    strokeDasharray="4,3"
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                  {/* badge */}
                  <rect
                    x={Math.max(0, x - 60)}
                    y={-18}
                    width={120}
                    height={16}
                    rx={4}
                    fill="rgb(245, 158, 11)"
                    opacity={0.12}
                  />
                  <text
                    x={x}
                    y={-6}
                    textAnchor="middle"
                    className="text-[10px] fill-amber-700"
                  >
                    {m.note ? m.note : "Scope change"}
                  </text>
                </g>
              );
            })}

            {/* Hover tooltip for markers */}
            {hoveredMarker !== null &&
              (() => {
                const m = scopeMarkers[hoveredMarker];
                const idx = dateToIndex(m.date);
                if (idx === null) return null;
                const x = xScale(idx);
                const tooltipWidth = 180;
                const tooltipX = Math.min(
                  Math.max(0, x - tooltipWidth / 2),
                  innerWidth - tooltipWidth
                );
                const tooltipY = 10; // under top padding
                return (
                  <g>
                    {/* tooltip container */}
                    <rect
                      x={tooltipX}
                      y={tooltipY}
                      width={tooltipWidth}
                      height={48}
                      rx={6}
                      fill="#fff"
                      stroke="#f59e0b"
                      opacity={0.95}
                    />
                    {/* arrow */}
                    <path
                      d={`M ${x} ${tooltipY + 48} l -6 -6 h 12 z`}
                      fill="#fff"
                      stroke="#f59e0b"
                    />
                    <text
                      x={tooltipX + 8}
                      y={tooltipY + 18}
                      className="fill-foreground"
                      fontSize={12}
                    >
                      {m.note ? m.note : "Scope change"}
                    </text>
                    <text
                      x={tooltipX + 8}
                      y={tooltipY + 34}
                      className="fill-muted-foreground"
                      fontSize={11}
                    >
                      {new Date(m.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </text>
                  </g>
                );
              })()}

            {/* X-axis labels */}
            {xLabels.map((d) => {
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

            {/* Y-axis label */}
            <text
              x={-40}
              y={innerHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, -40, ${innerHeight / 2})`}
              className="text-xs fill-muted-foreground font-medium"
            >
              Remaining Tasks
            </text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm flex-wrap">
        {showIdeal && (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 bg-blue-500 opacity-60"
              style={{ borderTop: "2px dashed rgb(59, 130, 246)" }}
            ></div>
            <span className="text-muted-foreground">Ideal Burndown</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-primary"></div>
          <span className="text-muted-foreground">
            {projectName || `Project ${projectId}`}
          </span>
        </div>
        {showComparison &&
          comparisonData.map((proj) => (
            <div key={proj.id} className="flex items-center gap-2">
              <div
                className="w-6 h-0.5 opacity-70"
                style={{ borderTop: `2px dashed ${proj.color}` }}
              ></div>
              <span className="text-muted-foreground">{proj.name}</span>
            </div>
          ))}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-primary"></div>
          <span className="text-muted-foreground">Actual Progress</span>
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
            <p className="text-2xl font-bold">{stats.initial}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.completed}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Remaining</p>
            <p className="text-2xl font-bold">{stats.current}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Progress</p>
            <p className="text-2xl font-bold">{stats.progress}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Velocity</p>
            <p className="text-2xl font-bold">{stats.velocity}</p>
            <p className="text-xs text-muted-foreground">tasks/day</p>
          </div>
        </div>
      )}
    </Card>
  );
}
