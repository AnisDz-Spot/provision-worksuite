"use client";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Columns3, Plus, ChevronRight, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import users from "@/data/users.json";

type SprintTask = {
  id: string;
  title: string;
  assignee: string;
  priority: "low" | "medium" | "high";
  storyPoints: number;
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
};

type Sprint = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: number;
  tasks: SprintTask[];
};

// Mock sprint data
const defaultSprint: Sprint = {
  id: "sprint-1",
  name: "Sprint 12 - Q1 2025",
  startDate: "2025-01-06",
  endDate: "2025-01-19",
  capacity: 40,
  tasks: [
    {
      id: "t1",
      title: "User authentication flow",
      assignee: "Alice",
      priority: "high",
      storyPoints: 8,
      status: "in-progress",
    },
    {
      id: "t2",
      title: "Dashboard analytics",
      assignee: "Bob",
      priority: "high",
      storyPoints: 5,
      status: "in-progress",
    },
    {
      id: "t3",
      title: "API rate limiting",
      assignee: "Alice",
      priority: "medium",
      storyPoints: 3,
      status: "review",
    },
    {
      id: "t4",
      title: "Email notifications",
      assignee: "Carol",
      priority: "medium",
      storyPoints: 5,
      status: "todo",
    },
    {
      id: "t5",
      title: "Dark mode support",
      assignee: "Bob",
      priority: "low",
      storyPoints: 3,
      status: "todo",
    },
    {
      id: "t6",
      title: "Export to PDF",
      assignee: "Anis Dzed",
      priority: "low",
      storyPoints: 2,
      status: "backlog",
    },
    {
      id: "t7",
      title: "Search optimization",
      assignee: "Alice",
      priority: "high",
      storyPoints: 5,
      status: "done",
    },
    {
      id: "t8",
      title: "Mobile responsive fixes",
      assignee: "Carol",
      priority: "medium",
      storyPoints: 3,
      status: "done",
    },
  ],
};

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-gray-500" },
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in-progress", title: "In Progress", color: "bg-amber-500" },
  { id: "review", title: "Review", color: "bg-purple-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
] as const;

import { shouldUseMockData } from "@/lib/dataSource";

export function SprintPlanning() {
  // Strict Mode: Use empty sprint if not in mock mode
  const [sprint, setSprint] = useState<Sprint>(
    shouldUseMockData()
      ? defaultSprint
      : {
          id: "sprint-empty",
          name: "Current Sprint",
          startDate: new Date().toISOString(),
          endDate: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          capacity: 0,
          tasks: [],
        }
  );
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<SprintTask | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("You");
  const memberList = (shouldUseMockData() ? users : []) as Array<{
    id: string;
    name: string;
    avatarColor?: string;
  }>;

  const getAvatarColorClass = (color?: string) => {
    switch (color) {
      case "indigo":
        return "bg-indigo-500/10 text-indigo-600";
      case "green":
        return "bg-green-500/10 text-green-600";
      case "pink":
        return "bg-pink-500/10 text-pink-600";
      case "yellow":
        return "bg-yellow-500/10 text-yellow-600";
      case "blue":
        return "bg-blue-500/10 text-blue-600";
      default:
        return "bg-primary/10 text-primary";
    }
  };
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [newTaskPoints, setNewTaskPoints] = useState(3);

  const tasksByColumn = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.id] = sprint.tasks.filter((t) => t.status === col.id);
        return acc;
      },
      {} as Record<string, SprintTask[]>
    );
  }, [sprint.tasks]);

  const stats = useMemo(() => {
    const totalPoints = sprint.tasks.reduce((sum, t) => sum + t.storyPoints, 0);
    const completedPoints = sprint.tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + t.storyPoints, 0);
    const inProgressPoints = sprint.tasks
      .filter((t) => t.status === "in-progress" || t.status === "review")
      .reduce((sum, t) => sum + t.storyPoints, 0);

    return {
      total: totalPoints,
      completed: completedPoints,
      inProgress: inProgressPoints,
      remaining: totalPoints - completedPoints - inProgressPoints,
      velocity: Math.round((completedPoints / totalPoints) * 100),
    };
  }, [sprint.tasks]);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (!draggedTask) return;

    setSprint((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === draggedTask
          ? { ...t, status: columnId as SprintTask["status"] }
          : t
      ),
    }));
    setDraggedTask(null);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: SprintTask = {
      id: `t${Date.now()}`,
      title: newTaskTitle,
      assignee: newTaskAssignee,
      priority: newTaskPriority,
      storyPoints: newTaskPoints,
      status: "backlog",
    };

    setSprint((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));

    // Reset form
    setNewTaskTitle("");
    setNewTaskAssignee("You");
    setNewTaskPriority("medium");
    setNewTaskPoints(3);
    setShowAddTask(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-500/5";
      case "medium":
        return "border-l-amber-500 bg-amber-500/5";
      case "low":
        return "border-l-blue-500 bg-blue-500/5";
      default:
        return "border-l-gray-500";
    }
  };

  const daysRemaining = Math.ceil(
    (new Date(sprint.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{sprint.name}</h2>
            <p className="text-sm text-muted-foreground">
              {new Date(sprint.startDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(sprint.endDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              <span className="ml-2">
                •{" "}
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "Sprint ended"}
              </span>
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddTask(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Task
        </Button>
      </div>

      {/* Sprint stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-accent/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Points</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.completed}
          </div>
        </div>
        <div className="bg-amber-500/10 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">In Progress</div>
          <div className="text-2xl font-bold text-amber-600">
            {stats.inProgress}
          </div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Remaining</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.remaining}
          </div>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Velocity</div>
          <div className="text-2xl font-bold text-purple-600">
            {stats.velocity}%
          </div>
        </div>
      </div>

      {/* Sprint capacity */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Sprint Capacity</span>
          <span className="font-medium">
            {stats.total} / {sprint.capacity} points
          </span>
        </div>
        <div className="h-2 bg-accent rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${stats.total > sprint.capacity ? "bg-red-500" : "bg-primary"}`}
            style={{
              width: `${Math.min(100, (stats.total / sprint.capacity) * 100)}%`,
            }}
          />
        </div>
        {stats.total > sprint.capacity && (
          <p className="text-xs text-red-600 mt-1">
            ⚠️ Sprint is over capacity by {stats.total - sprint.capacity} points
          </p>
        )}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <div className={`w-2 h-2 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {tasksByColumn[column.id]?.length || 0}
              </span>
            </div>

            <div className="space-y-2 flex-1">
              {tasksByColumn[column.id]?.map((task, idx) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  className={`border-l-4 ${getPriorityColor(task.priority)} rounded-lg p-3 cursor-move hover:shadow-md transition-all group relative ${draggedTask === task.id ? "opacity-50" : ""}`}
                  onClick={() => {
                    setEditTaskId(task.id);
                    setEditTask(task);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium mb-2 line-clamp-2">
                        {task.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const m = memberList.find(
                              (u) => u.name === task.assignee
                            );
                            const cls = getAvatarColorClass(m?.avatarColor);
                            return (
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${cls}`}
                              >
                                {task.assignee.charAt(0)}
                              </div>
                            );
                          })()}
                          <span className="text-xs text-muted-foreground truncate">
                            {task.assignee}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-accent">
                          <span>{task.storyPoints}</span>
                          <span className="text-muted-foreground">pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this task?")) {
                        setSprint((prev) => ({
                          ...prev,
                          tasks: prev.tasks.filter((t) => t.id !== task.id),
                        }));
                      }
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {(!tasksByColumn[column.id] ||
                tasksByColumn[column.id].length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm opacity-50">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sprint burndown hint */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronRight className="w-4 h-4" />
          <span>
            Sprint burndown chart and detailed metrics available in Analytics
          </span>
        </div>
      </div>

      {/* Add/Edit Task Modal */}
      {(showAddTask || editTaskId) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowAddTask(false);
            setEditTaskId(null);
            setEditTask(null);
          }}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {editTaskId ? "Edit Task" : "Add New Task"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
                  value={editTaskId ? (editTask?.title ?? "") : newTaskTitle}
                  onChange={(e) => {
                    if (editTaskId)
                      setEditTask((t) =>
                        t ? { ...t, title: e.target.value } : t
                      );
                    else setNewTaskTitle(e.target.value);
                  }}
                  placeholder="Enter task title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Assignee
                </label>
                <Dropdown
                  trigger={
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      {(() => {
                        const name = editTaskId
                          ? (editTask?.assignee ?? "")
                          : newTaskAssignee;
                        const m = memberList.find((u) => u.name === name);
                        const cls = getAvatarColorClass(m?.avatarColor);
                        return (
                          <>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${cls}`}
                            >
                              {name.charAt(0)}
                            </div>
                            <span className="text-sm">{name}</span>
                          </>
                        );
                      })()}
                    </Button>
                  }
                  items={memberList.map((m) => ({
                    label: m.name,
                    icon: (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColorClass(m.avatarColor)}`}
                      >
                        {m.name.charAt(0)}
                      </div>
                    ),
                    onClick: () => {
                      if (editTaskId)
                        setEditTask((t) =>
                          t ? { ...t, assignee: m.name } : t
                        );
                      else setNewTaskAssignee(m.name);
                    },
                  }))}
                  align="start"
                  searchable
                  searchPlaceholder="Search members..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select
                    className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
                    value={
                      editTaskId
                        ? (editTask?.priority ?? "medium")
                        : newTaskPriority
                    }
                    onChange={(e) => {
                      if (editTaskId)
                        setEditTask((t) =>
                          t
                            ? {
                                ...t,
                                priority: e.target.value as
                                  | "low"
                                  | "medium"
                                  | "high",
                              }
                            : t
                        );
                      else
                        setNewTaskPriority(
                          e.target.value as "low" | "medium" | "high"
                        );
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="13"
                    className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
                    value={
                      editTaskId ? (editTask?.storyPoints ?? 1) : newTaskPoints
                    }
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (editTaskId)
                        setEditTask((t) =>
                          t ? { ...t, storyPoints: val } : t
                        );
                      else setNewTaskPoints(val);
                    }}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                {editTaskId ? (
                  <Button
                    onClick={() => {
                      if (!editTask) return;
                      setSprint((prev) => ({
                        ...prev,
                        tasks: prev.tasks.map((t) =>
                          t.id === editTaskId ? { ...t, ...editTask } : t
                        ),
                      }));
                      setEditTaskId(null);
                      setEditTask(null);
                    }}
                    className="flex-1"
                  >
                    Save
                  </Button>
                ) : (
                  <Button onClick={handleAddTask} className="flex-1">
                    Add Task
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddTask(false);
                    setEditTaskId(null);
                    setEditTask(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
