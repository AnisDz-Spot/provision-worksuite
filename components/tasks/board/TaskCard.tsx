"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  GripVertical,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: any;
  colId: string;
  isAuthorized: boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  draggedTask: string | null;
  priorityColors: Record<string, string>;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    colId: string,
    taskId: string
  ) => void;
  onDragEnd: () => void;
  onTaskClick: (task: any) => void;
  onSelectToggle: (taskId: string, selected: boolean) => void;
  onDeleteClick: (columnId: string, taskId: string, taskTitle: string) => void;
  isBlocked?: boolean;
};

export function TaskCard({
  task,
  colId,
  isAuthorized,
  selectMode,
  selectedIds,
  draggedTask,
  priorityColors,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onSelectToggle,
  onDeleteClick,
  isBlocked,
}: TaskCardProps) {
  const isSelected = selectedIds.has(task.id);
  const isOverdue =
    task.due &&
    task.due < new Date().toISOString().slice(0, 10) &&
    colId !== "done";

  return (
    <motion.div
      key={task.id}
      className={cn(
        "rounded-lg border-2 bg-card px-4 py-3 shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow",
        draggedTask === task.id ? "opacity-50" : ""
      )}
      whileHover={{
        y: -2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      }}
      draggable={isAuthorized && !selectMode}
      onDragStart={(e) => onDragStart(e as any, colId, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onTaskClick(task)}
    >
      {selectMode && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectToggle(task.id, e.target.checked);
            }}
          />
          <span className="text-muted-foreground">Select</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 font-medium text-base truncate">
          {task.title}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(colId, task.id, task.title);
            }}
            className="p-1 rounded hover:bg-accent transition-colors cursor-pointer"
            title="Delete task"
          >
            <X className="w-3 h-3" />
          </button>
          <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              task.avatar ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assignee || "U")}`
            }
            alt={task.assignee}
            className="w-5 h-5 rounded-full bg-accent"
            title={task.assignee}
          />
          <span
            className={cn(
              "flex items-center gap-1",
              isOverdue && "text-destructive"
            )}
          >
            <CalendarDays className="w-3 h-3" />
            {task.due}
            {isOverdue && (
              <span title="Overdue">
                <AlertTriangle className="w-3 h-3 text-destructive" />
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isBlocked && colId !== "done" && (
            <span title="Blocked by dependencies">
              <Lock className="w-3 h-3 text-muted-foreground" />
            </span>
          )}
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              priorityColors[task.priority]
            )}
            title={task.priority}
          />
        </div>
      </div>
      {task.milestoneTitle && (
        <div className="mt-1 text-[10px] text-muted-foreground truncate">
          Milestone: {task.milestoneTitle}
        </div>
      )}
    </motion.div>
  );
}
