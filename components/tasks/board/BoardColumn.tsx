"use client";

import React from "react";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";

type BoardColumnProps = {
  col: {
    id: string;
    title: string;
    color: string;
    bgColor: string;
    tasks: any[];
  };
  filterAssignee: string;
  filterMilestone: string;
  isAuthorized: boolean;
  selectMode: boolean;
  selectedIds: Set<string>;
  draggedTask: string | null;
  priorityColors: Record<string, string>;
  isBlocked: boolean; // This might need to be per-task, let's refine
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetColId: string) => void;
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    colId: string,
    taskId: string
  ) => void;
  onDragEnd: () => void;
  onTaskClick: (task: any) => void;
  onSelectToggle: (taskId: string, selected: boolean) => void;
  onDeleteTaskClick: (
    columnId: string,
    taskId: string,
    taskTitle: string
  ) => void;
  onAddTaskClick: (columnId: string) => void;
  // We'll pass a helper to check if a task is blocked
  checkIsBlocked: (taskId: string) => boolean;
};

export function BoardColumn({
  col,
  filterAssignee,
  filterMilestone,
  isAuthorized,
  selectMode,
  selectedIds,
  draggedTask,
  priorityColors,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onTaskClick,
  onSelectToggle,
  onDeleteTaskClick,
  onAddTaskClick,
  checkIsBlocked,
}: BoardColumnProps) {
  const filteredTasks = col.tasks
    .filter((task: any) =>
      filterAssignee === "all" ? true : task.assignee === filterAssignee
    )
    .filter((task: any) =>
      filterMilestone === "all"
        ? true
        : (task.milestoneId || "") === filterMilestone
    );

  return (
    <div
      className={`${col.bgColor} border-2 ${col.color} rounded-xl shadow-md p-4 flex flex-col min-h-80 transition-colors duration-200`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, col.id)}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold tracking-tight text-lg flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${col.color.replace("border", "bg")}`}
          />
          {col.title}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-background/50">
            {filteredTasks.length}
          </span>
          {isAuthorized && (
            <button
              onClick={() => onAddTaskClick(col.id)}
              className="p-1 rounded hover:bg-background/50 transition-colors cursor-pointer"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            colId={col.id}
            isAuthorized={isAuthorized}
            selectMode={selectMode}
            selectedIds={selectedIds}
            draggedTask={draggedTask}
            priorityColors={priorityColors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTaskClick={onTaskClick}
            onSelectToggle={onSelectToggle}
            onDeleteClick={onDeleteTaskClick}
            isBlocked={checkIsBlocked(task.id)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg py-8">
            <span className="text-xs text-muted-foreground italic">
              No tasks
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
