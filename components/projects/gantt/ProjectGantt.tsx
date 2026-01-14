"use client";

import React, { useMemo, useState } from "react";
import {
  format,
  addDays,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectGanttProps {
  tasks: any[]; // Ideally defined Task type, but keep any for compatibility with Loose upstream props
}

const COLUMN_WIDTH = 50;

export function ProjectGantt({ tasks }: ProjectGanttProps) {
  const [viewDate, setViewDate] = useState(new Date());

  // Filter tasks that have dates relevant for Gantt
  const ganttTasks = useMemo(() => {
    return tasks.filter((t: any) => t.due || t.startDate || t.createdAt);
  }, [tasks]);

  // Calculate timeline range logic (visible window)
  const startDate = startOfWeek(viewDate, { weekStartsOn: 1 });
  const endDate = addDays(startDate, 14); // Show 2 weeks
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handlePrev = () => setViewDate(addDays(viewDate, -7));
  const handleNext = () => setViewDate(addDays(viewDate, 7));

  return (
    <Card className="p-0 overflow-hidden border rounded-lg bg-card">
      {/* Toolbar */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-medium text-sm">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {ganttTasks.length} tasks scheduled
        </div>
      </div>

      {/* Chart View */}
      <div className="flex overflow-x-auto">
        {/* Task List Column (Fixed sticky left) */}
        <div className="sticky left-0 z-20 bg-card border-r w-64 shadow-sm">
          <div className="h-[50px] border-b flex items-center px-4 font-semibold text-xs text-muted-foreground uppercase bg-muted/5">
            Task Name
          </div>
          {ganttTasks.map((task: any) => (
            <div
              key={task.id}
              className="h-[40px] px-4 flex items-center border-b text-sm truncate"
              title={task.title}
            >
              {task.title}
            </div>
          ))}
          {ganttTasks.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No tasks with dates found.
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="flex-1 min-w-[800px]">
          {/* Header Row */}
          <div className="h-[50px] border-b flex bg-muted/5">
            {days.map((day: Date) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "shrink-0 border-r flex flex-col items-center justify-center text-xs",
                  isSameDay(day, new Date())
                    ? "bg-primary/5 font-semibold text-primary"
                    : "text-muted-foreground"
                )}
                style={{ width: COLUMN_WIDTH }}
              >
                <span>{format(day, "EEE")}</span>
                <span className="font-bold">{format(day, "d")}</span>
              </div>
            ))}
          </div>

          {/* Grid & Bars */}
          <div className="relative">
            {/* Background Grid */}
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((day: Date) => (
                <div
                  key={day.toISOString()}
                  className="border-r h-full"
                  style={{ width: COLUMN_WIDTH }}
                />
              ))}
            </div>

            {/* Task Bars */}
            {ganttTasks.map((task: any) => {
              // Determine start and end
              const start = task.startDate
                ? new Date(task.startDate)
                : new Date(task.createdAt);
              const end = task.due ? new Date(task.due) : addDays(start, 1);

              // Calculate position relative to visible window
              const offsetDays = differenceInDays(start, startDate);
              const durationDays = Math.max(differenceInDays(end, start), 1);

              const left = offsetDays * COLUMN_WIDTH;
              const width = durationDays * COLUMN_WIDTH;

              // Determine Color based on status
              let colorClass = "bg-blue-500";
              if (task.status === "done") colorClass = "bg-green-500";
              if (task.status === "blocked") colorClass = "bg-red-500";
              if (task.status === "in_progress") colorClass = "bg-amber-500";

              return (
                <div key={task.id} className="h-[40px] border-b relative group">
                  {/* The Bar */}
                  {left + width > 0 && (
                    <div
                      className={cn(
                        "absolute top-2 h-6 rounded-md shadow-sm text-[10px] text-white flex items-center px-2 whitespace-nowrap overflow-hidden transition-all hover:brightness-110",
                        colorClass
                      )}
                      style={{
                        left: Math.max(left, 0),
                        width: Math.max(width, COLUMN_WIDTH),
                      }}
                      title={`${format(start, "MMM d")} - ${format(end, "MMM d")}: ${task.title}`}
                    >
                      {task.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
