"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  CalendarDays,
  GripVertical,
  Plus,
  X,
  Lock,
  AlertTriangle,
  Play,
  Edit2,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import users from "@/data/users.json";
import { useTimeTracker } from "@/components/timetracking/TimeTrackingWidget";
import { useToaster } from "@/components/ui/Toaster";
import {
  TaskItem,
  getTasksByProject,
  upsertTask,
  deleteTask as removeTask,
  getIncompleteDependencyIds,
  getMilestonesByProject,
  addTimeLog,
  getTimeLogsForTask,
} from "@/lib/utils";
import { loadTasks, saveTasks } from "@/lib/data";

const MOCK_BOARD = [
  {
    id: "todo",
    title: "Todo",
    color: "border-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/30",
    tasks: [
      {
        id: "1",
        title: "Setup Firebase Auth",
        assignee: "Alice",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        due: "2025-12-07",
        priority: "high",
        milestoneTitle: "",
      },
      {
        id: "2",
        title: "Design Project Modal",
        assignee: "Bob",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        due: "2025-12-10",
        priority: "medium",
        milestoneTitle: "",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "border-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    tasks: [
      {
        id: "3",
        title: "Dashboard UI",
        assignee: "Carol",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carol",
        due: "2025-12-02",
        priority: "high",
        milestoneTitle: "",
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "border-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/30",
    tasks: [
      {
        id: "4",
        title: "TypeScript Types",
        assignee: "David",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        due: "2025-12-04",
        priority: "low",
        milestoneTitle: "",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "border-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/30",
    tasks: [
      {
        id: "5",
        title: "Project Planning",
        assignee: "Eve",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
        due: "2025-11-28",
        priority: "medium",
        milestoneTitle: "",
      },
    ],
  },
];

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

type KanbanBoardProps = {
  projectId?: string;
  projectUid?: string;
  projectMembers?: { name: string; avatarUrl?: string }[];
  onTaskUpdate?: () => void;
};

import { shouldUseMockData } from "@/lib/dataSource";

// ... existing imports

export function KanbanBoard({
  projectId,
  projectUid,
  projectMembers = [],
  onTaskUpdate,
}: KanbanBoardProps) {
  const { startTimer } = useTimeTracker();
  const { show } = useToaster();

  // Strict Mode: Only use MOCK_BOARD if explicitly in mock mode
  const [columns, setColumns] = useState(
    shouldUseMockData()
      ? MOCK_BOARD
      : [
          {
            id: "todo",
            title: "Todo",
            color: "border-slate-400",
            bgColor: "bg-slate-50 dark:bg-slate-900/30",
            tasks: [],
          },
          {
            id: "in-progress",
            title: "In Progress",
            color: "border-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-900/30",
            tasks: [],
          },
          {
            id: "review",
            title: "Review",
            color: "border-amber-400",
            bgColor: "bg-amber-50 dark:bg-amber-900/30",
            tasks: [],
          },
          {
            id: "done",
            title: "Done",
            color: "border-green-400",
            bgColor: "bg-green-50 dark:bg-green-900/30",
            tasks: [],
          },
        ]
  );

  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("You");
  const [newTaskDue, setNewTaskDue] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [newTaskPriority, setNewTaskPriority] = useState("medium");

  // Strict Mode: Only use mock users if explicitly in mock mode
  const memberList: Array<{ id: string; name: string; avatarColor?: string }> =
    (
      projectMembers && projectMembers.length > 0
        ? projectMembers.map((m, i) => ({ id: `pm-${i}`, name: m.name }))
        : shouldUseMockData()
          ? (users as any)
          : []
    ) as Array<{ id: string; name: string; avatarColor?: string }>;

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
  const [newTaskEstimate, setNewTaskEstimate] = useState<string>("");
  const [newTaskType, setNewTaskType] = useState<string>("feature");
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editEstimate, setEditEstimate] = useState("");
  const [editMilestone, setEditMilestone] = useState("");
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deleteCardConfirm, setDeleteCardConfirm] = useState<{
    columnId: string;
    taskId: string;
    taskTitle: string;
  } | null>(null);
  const [timeLogInput, setTimeLogInput] = useState("");
  const [viewLogsOpen, setViewLogsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterMilestone, setFilterMilestone] = useState<string>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [blocked, setBlocked] = useState(false);

  const refreshFromStorage = async () => {
    if (!projectId) return; // No persistence without project context

    let tasks: TaskItem[] = [];
    if (!shouldUseMockData()) {
      const dbTasks = await loadTasks();
      // Filter by projectId and map to TaskItem format
      tasks = dbTasks
        .filter(
          (t: any) => t.projectId === projectId || t.projectId === projectUid
        )
        .map((t: any) => ({
          id: t.uid || t.id,
          projectId: t.projectId,
          title: t.title,
          status: t.status as any,
          assignee: t.assignee?.name || t.assignee || "Unassigned",
          due: t.due ? new Date(t.due).toISOString().split("T")[0] : "",
          priority: t.priority as any,
          estimateHours: t.estimateHours,
          loggedHours: t.loggedHours,
          milestoneId: t.milestoneId,
        }));
    } else {
      tasks = getTasksByProject(projectId);
    }

    const msLookup = new Map<string, string>();
    try {
      const ms = getMilestonesByProject(projectId);
      ms.forEach((m) => msLookup.set(m.id, m.title));
    } catch {}

    const toCardTask = (t: TaskItem) => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee || "Unassigned",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.assignee || "User")}`,
      due: t.due || new Date().toISOString().split("T")[0],
      priority: t.priority || "medium",
      status: t.status,
      milestoneId: t.milestoneId || "",
      milestoneTitle: t.milestoneId ? msLookup.get(t.milestoneId) || "" : "",
      estimateHours: t.estimateHours,
      loggedHours: t.loggedHours,
    });

    const statusMap: Record<string, string> = {
      todo: "todo",
      "in-progress": "in-progress",
      in_progress: "in-progress",
      review: "review",
      done: "done",
    };

    const byStatus = {
      todo: tasks.filter((t) => statusMap[t.status] === "todo").map(toCardTask),
      "in-progress": tasks
        .filter((t) => statusMap[t.status] === "in-progress")
        .map(toCardTask),
      review: tasks
        .filter((t) => statusMap[t.status] === "review")
        .map(toCardTask),
      done: tasks.filter((t) => statusMap[t.status] === "done").map(toCardTask),
    } as const;

    setColumns([
      {
        id: "todo",
        title: "Todo",
        color: "border-slate-400",
        bgColor: "bg-slate-50 dark:bg-slate-900/30",
        tasks: byStatus.todo,
      },
      {
        id: "in-progress",
        title: "In Progress",
        color: "border-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/30",
        tasks: byStatus["in-progress"],
      },
      {
        id: "review",
        title: "Review",
        color: "border-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/30",
        tasks: byStatus.review,
      },
      {
        id: "done",
        title: "Done",
        color: "border-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/30",
        tasks: byStatus.done,
      },
    ]);
  };

  useEffect(() => {
    if (projectId) {
      refreshFromStorage();
    } else {
      if (shouldUseMockData()) {
        setColumns(MOCK_BOARD);
      } else {
        // Clear board if not mock mode
        setColumns((prev) => prev.map((c) => ({ ...c, tasks: [] })));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setBlocked(false);
      return;
    }
    try {
      const incompletes = getIncompleteDependencyIds(projectId);
      setBlocked(incompletes.length > 0);
    } catch {
      setBlocked(false);
    }
  }, [projectId, columns]);

  const visibleColumns = useMemo(() => {
    return columns.filter((c) =>
      filterStatus === "all" ? true : c.id === filterStatus
    );
  }, [columns, filterStatus]);

  function onDragStart(
    e: React.DragEvent<HTMLDivElement>,
    colId: string,
    taskId: string
  ) {
    setDraggedTask(taskId);
    e.dataTransfer.setData("text/plain", JSON.stringify({ colId, taskId }));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDraggedTask(null);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>, targetColId: string) {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");
    if (!text) return;
    const { colId, taskId } = JSON.parse(text) as {
      colId: string;
      taskId: string;
    };
    if (colId === targetColId) {
      setDraggedTask(null);
      return;
    }
    setColumns((prev) => {
      const next = prev.map((c) => ({ ...c, tasks: [...c.tasks] }));
      const from = next.find((c) => c.id === colId);
      const to = next.find((c) => c.id === targetColId);
      if (!from || !to) return prev;
      const idx = from.tasks.findIndex((t) => t.id === taskId);
      if (idx >= 0) {
        const [moved] = from.tasks.splice(idx, 1);
        to.tasks.push(moved);
        if (projectId) {
          const updated: TaskItem = {
            id: moved.id,
            projectId,
            title: moved.title,
            status: targetColId as TaskItem["status"],
            assignee: moved.assignee,
            due: moved.due,
            priority:
              (moved.priority as "high" | "medium" | "low") || undefined,
            milestoneId: (moved as any).milestoneId || undefined,
          };

          if (!shouldUseMockData()) {
            saveTasks([updated as any]).then(() => {
              onTaskUpdate?.();
            });
          } else {
            upsertTask(updated);
            queueMicrotask(() => onTaskUpdate?.());
          }
        }
      }
      return next;
    });
    setDraggedTask(null);
  }

  const assignees = useMemo(() => {
    if (projectId && projectMembers.length > 0) {
      const set = new Set<string>([
        "You",
        ...projectMembers.map((m) => m.name),
      ]);
      return Array.from(set);
    }
    const names = columns.flatMap((c) =>
      c.tasks.map((t: any) => t.assignee).filter(Boolean)
    );
    const set = new Set<string>(["You", ...names]);
    return Array.from(set);
  }, [columns, projectId, projectMembers]);

  function openAddModal(columnId: string) {
    setTargetColumn(columnId);
    setNewTaskTitle("");
    setNewTaskAssignee("You");
    setNewTaskDue(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setNewTaskPriority("medium");
    setNewTaskEstimate("");
    setNewTaskType("feature");
    setMilestoneId("");
    setModalOpen(true);
  }

  function startEditTask(task: any) {
    setEditMode(true);
    setEditTitle(task.title);
    setEditAssignee(task.assignee);
    setEditDue(task.due);
    setEditPriority(task.priority);
    setEditEstimate(
      task.estimateHours !== undefined ? task.estimateHours.toString() : ""
    );
    setEditMilestone((task as any).milestoneId || "");
  }

  function saveTaskEdit() {
    if (!detailTask || !projectId || !editTitle.trim()) return;
    const updated: TaskItem = {
      id: detailTask.id,
      projectId,
      title: editTitle.trim(),
      status: (detailTask.status || "todo") as TaskItem["status"],
      assignee: editAssignee,
      due: editDue,
      priority: editPriority as "low" | "medium" | "high",
      milestoneId: editMilestone || undefined,
      estimateHours: editEstimate ? parseFloat(editEstimate) : undefined,
      loggedHours: detailTask.loggedHours || 0,
    };
    if (!shouldUseMockData()) {
      saveTasks([updated as any]).then(() => {
        refreshFromStorage();
        show("success", "Task updated successfully");
        if (onTaskUpdate) onTaskUpdate();
      });
    } else {
      upsertTask(updated);
      refreshFromStorage();
      show("success", "Task updated successfully");
      if (onTaskUpdate) onTaskUpdate();
    }

    setEditMode(false);

    // Update detailTask from storage to reflect saved changes
    // (This part might be slightly delayed in Live mode, but UI state is already updated)
    if (shouldUseMockData()) {
      const savedTask = getTasksByProject(projectId).find(
        (t) => t.id === updated.id
      );
      if (savedTask) {
        setDetailTask({
          ...detailTask,
          title: savedTask.title,
          assignee: savedTask.assignee || "Unassigned",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(savedTask.assignee || "User")}`,
          due: savedTask.due,
          priority: savedTask.priority,
          status: savedTask.status,
          estimateHours: savedTask.estimateHours,
          loggedHours: savedTask.loggedHours,
          milestoneId: savedTask.milestoneId,
        });
      }
    }
  }

  function cancelEditTask() {
    setEditMode(false);
  }

  function confirmDeleteTask() {
    if (!detailTask || !projectId) return;
    removeTask(detailTask.id);
    setDeleteTaskConfirm(null);
    setDetailOpen(false);
    refreshFromStorage();
    show("success", "Task deleted successfully");
    if (onTaskUpdate) onTaskUpdate();
  }

  function handleLogTime() {
    if (!detailTask || !projectId || !timeLogInput.trim()) return;
    const value = parseFloat(timeLogInput);
    if (isNaN(value) || value <= 0) {
      show("error", "Please enter a valid number of hours");
      return;
    }
    const result = addTimeLog(
      detailTask.id,
      projectId,
      value,
      undefined,
      detailTask.assignee
    );
    if (result) {
      show("success", `Logged ${value} hours`);
      setTimeLogInput("");
      // Update detailTask from storage to reflect the logged hours
      const updatedTask = getTasksByProject(projectId).find(
        (t) => t.id === detailTask.id
      );
      if (updatedTask) {
        setDetailTask({
          ...detailTask,
          title: updatedTask.title,
          assignee: updatedTask.assignee || "Unassigned",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(updatedTask.assignee || "User")}`,
          due: updatedTask.due,
          priority: updatedTask.priority,
          status: updatedTask.status,
          milestoneId: updatedTask.milestoneId,
          estimateHours: updatedTask.estimateHours,
          loggedHours: updatedTask.loggedHours,
        });
      }
      refreshFromStorage();
      if (onTaskUpdate) onTaskUpdate();
    } else {
      show("error", "Failed to log time");
    }
  }

  function addTask() {
    if (!newTaskTitle.trim() || !targetColumn) return;
    const id = `task-${Date.now()}`;
    const newTask = {
      id,
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newTaskAssignee)}`,
      due: newTaskDue,
      priority: newTaskPriority as "high" | "medium" | "low",
      milestoneTitle: "",
    };
    if (projectId) {
      const t: TaskItem = {
        id,
        projectId,
        title: newTask.title,
        status: targetColumn as TaskItem["status"],
        assignee: newTask.assignee,
        due: newTask.due,
        priority: newTask.priority,
        milestoneId: milestoneId || undefined,
        estimateHours: newTaskEstimate
          ? parseFloat(newTaskEstimate)
          : undefined,
        loggedHours: 0,
      };

      if (!shouldUseMockData()) {
        saveTasks([t as any]).then(() => {
          refreshFromStorage();
          if (onTaskUpdate) onTaskUpdate();
        });
      } else {
        upsertTask(t);
        refreshFromStorage();
        if (onTaskUpdate) onTaskUpdate();
      }
    } else {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumn
            ? { ...col, tasks: [...col.tasks, newTask] }
            : col
        )
      );
    }
    setModalOpen(false);
    setNewTaskTitle("");
    setNewTaskAssignee("You");
    setNewTaskDue("");
    setNewTaskPriority("medium");
    setNewTaskEstimate("");
    setMilestoneId("");
    setTargetColumn(null);
  }

  function deleteTask(columnId: string, taskId: string) {
    if (projectId) {
      removeTask(taskId);
      refreshFromStorage();
      if (onTaskUpdate) onTaskUpdate();
    } else {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
            : col
        )
      );
    }
    setDeleteCardConfirm(null);
  }

  return (
    <>
      {projectId && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-border bg-card text-foreground px-2 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <label className="text-sm">Assignee</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="rounded-md border border-border bg-card text-foreground px-2 py-1 text-sm min-w-32"
            >
              <option value="all">All</option>
              {assignees.map((a) => (
                <option key={`assignee-${a}`} value={a}>
                  {a}
                </option>
              ))}
            </select>
            {projectId && (
              <>
                <label className="text-sm">Milestone</label>
                <select
                  value={filterMilestone}
                  onChange={(e) => setFilterMilestone(e.target.value)}
                  className="rounded-md border border-border bg-card text-foreground px-2 py-1 text-sm min-w-32"
                >
                  <option value="all">All</option>
                  {getMilestonesByProject(projectId).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant={selectMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedIds(new Set());
                }}
              >
                {selectMode ? "Selection On" : "Select"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus("all");
                  setFilterAssignee("all");
                  setFilterMilestone("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          {selectMode && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  // Move selected to Done
                  const ids = Array.from(selectedIds);
                  ids.forEach((id) => {
                    // find task in columns
                    for (const c of columns) {
                      const t = (c.tasks as any[]).find((x) => x.id === id);
                      if (t) {
                        if (projectId) {
                          upsertTask({
                            id,
                            projectId,
                            title: t.title,
                            status: "done",
                            assignee: t.assignee,
                            due: t.due,
                            priority: t.priority,
                          });
                        }
                        break;
                      }
                    }
                  });
                  if (projectId) {
                    refreshFromStorage();
                    queueMicrotask(() => onTaskUpdate?.());
                  }
                  setSelectedIds(new Set());
                }}
                disabled={selectedIds.size === 0}
              >
                Move to Done
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const ids = Array.from(selectedIds);
                  ids.forEach((id) => removeTask(id));
                  if (projectId) refreshFromStorage();
                  setSelectedIds(new Set());
                }}
                disabled={selectedIds.size === 0}
              >
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`${col.bgColor} border-2 ${col.color} rounded-xl shadow-md p-4 flex flex-col min-h-80`}
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
                  {col.tasks.length}
                </span>
                <button
                  onClick={() => openAddModal(col.id)}
                  className="p-1 rounded hover:bg-background/50 transition-colors cursor-pointer"
                  title="Add task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1">
              {col.tasks
                .filter((task: any) =>
                  filterAssignee === "all"
                    ? true
                    : task.assignee === filterAssignee
                )
                .filter((task: any) =>
                  filterMilestone === "all"
                    ? true
                    : (task.milestoneId || "") === filterMilestone
                )
                .map((task) => (
                  <motion.div
                    key={task.id}
                    className={`rounded-lg border-2 bg-card px-4 py-3 shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-lg transition-shadow ${
                      draggedTask === task.id ? "opacity-50" : ""
                    }`}
                    whileHover={{
                      y: -2,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    }}
                    draggable={!selectMode}
                    onDragStart={(e) =>
                      onDragStart(
                        e as any as React.DragEvent<HTMLDivElement>,
                        col.id,
                        task.id
                      )
                    }
                    onDragEnd={onDragEnd}
                    onClick={() => {
                      if (selectMode) {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(task.id)) next.delete(task.id);
                          else next.add(task.id);
                          return next;
                        });
                      } else {
                        setDetailTask(task);
                        setDetailOpen(true);
                      }
                    }}
                  >
                    {selectMode && (
                      <div className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(task.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(task.id);
                              else next.delete(task.id);
                              return next;
                            });
                          }}
                        />
                        <span className="text-muted-foreground">Select</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 font-medium text-base">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCardConfirm({
                              columnId: col.id,
                              taskId: task.id,
                              taskTitle: task.title,
                            });
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
                          src={task.avatar}
                          alt={task.assignee}
                          className="w-5 h-5 rounded-full"
                          title={task.assignee}
                        />
                        <span
                          className={`flex items-center gap-1 ${task.due && task.due < new Date().toISOString().slice(0, 10) && col.id !== "done" ? "text-destructive" : ""}`}
                        >
                          <CalendarDays className="w-3 h-3" />
                          {task.due}
                          {task.due &&
                            task.due < new Date().toISOString().slice(0, 10) &&
                            col.id !== "done" && (
                              <span title="Overdue">
                                <AlertTriangle className="w-3 h-3 text-destructive" />
                              </span>
                            )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {blocked && col.id !== "done" && (
                          <span title="Blocked by dependencies">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                          </span>
                        )}
                        <span
                          className={`${priorityColors[task.priority]} w-2 h-2 rounded-full`}
                          title={task.priority}
                        />
                      </div>
                    </div>
                    {task.milestoneTitle && (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Milestone: {task.milestoneTitle}
                      </div>
                    )}
                    {projectId && col.id !== "done" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startTimer(
                            task.id,
                            task.title,
                            projectId,
                            task.assignee
                          );
                        }}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Start Timer
                      </button>
                    )}
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            // Reset form when modal closes
            setNewTaskTitle("");
            setNewTaskAssignee("You");
            setNewTaskDue("");
            setNewTaskPriority("medium");
            setNewTaskEstimate("");
            setMilestoneId("");
            setTargetColumn(null);
          }
        }}
        size="xl"
        className="md:min-w-[42vw]"
      >
        <div className="space-y-8">
          <h3 className="text-xl font-semibold">Create Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Implement OAuth flow"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Assignee</label>
              <Dropdown
                align="start"
                trigger={
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    {(() => {
                      const m = memberList.find(
                        (u) => u.name === newTaskAssignee
                      );
                      const cls = getAvatarColorClass((m as any)?.avatarColor);
                      return (
                        <>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${cls}`}
                          >
                            {newTaskAssignee.charAt(0)}
                          </div>
                          <span className="text-sm">{newTaskAssignee}</span>
                        </>
                      );
                    })()}
                  </Button>
                }
                items={memberList.map((m) => ({
                  label: m.name,
                  icon: (
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColorClass((m as any).avatarColor)}`}
                    >
                      {m.name.charAt(0)}
                    </div>
                  ),
                  onClick: () => setNewTaskAssignee(m.name),
                }))}
                searchable
                searchPlaceholder="Search members..."
              />
            </div>
            {projectId && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Milestone</label>
                <select
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm cursor-pointer"
                >
                  <option value="">None</option>
                  {getMilestonesByProject(projectId).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {projectId && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Estimate (hours)</label>
                <Input
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(e.target.value)}
                  placeholder="e.g. 3.5"
                />
              </div>
            )}
            <div className="space-y-3">
              <label className="text-sm font-medium">Task Type</label>
              <select
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value)}
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm cursor-pointer"
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="documentation">Documentation</option>
                <option value="research">Research</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={addTask}
              disabled={!newTaskTitle.trim()}
            >
              Add Task
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditMode(false);
          }
          setDetailOpen(open);
        }}
        size="lg"
        className="md:min-w-[40vw]"
      >
        {detailTask && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {editMode ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold"
                />
              ) : (
                <h3 className="text-2xl font-bold">{detailTask.title}</h3>
              )}
              {!editMode && projectId && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditTask(detailTask)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setDeleteTaskConfirm({
                        id: detailTask.id,
                        title: detailTask.title,
                      })
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Assigned to
                </div>
                {editMode ? (
                  <Dropdown
                    align="start"
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                      >
                        {(() => {
                          const m = memberList.find(
                            (u) => u.name === editAssignee
                          );
                          const cls = getAvatarColorClass(
                            (m as any)?.avatarColor
                          );
                          return (
                            <>
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${cls}`}
                              >
                                {editAssignee ? editAssignee.charAt(0) : "?"}
                              </div>
                              <span className="text-sm">
                                {editAssignee || "Unassigned"}
                              </span>
                            </>
                          );
                        })()}
                      </Button>
                    }
                    items={memberList.map((m) => ({
                      label: m.name,
                      icon: (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getAvatarColorClass((m as any).avatarColor)}`}
                        >
                          {m.name.charAt(0)}
                        </div>
                      ),
                      onClick: () => setEditAssignee(m.name),
                    }))}
                    searchable
                    searchPlaceholder="Search members..."
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailTask.avatar}
                      alt={detailTask.assignee}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="font-medium">{detailTask.assignee}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Due Date
                </div>
                {editMode ? (
                  <Input
                    type="date"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{detailTask.due}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Priority
                </div>
                {editMode ? (
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`${priorityColors[detailTask.priority]} w-3 h-3 rounded-full`}
                    />
                    <span className="font-medium capitalize">
                      {detailTask.priority}
                    </span>
                  </div>
                )}
              </div>
              {projectId && editMode && (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Milestone
                    </div>
                    <select
                      value={editMilestone}
                      onChange={(e) => setEditMilestone(e.target.value)}
                      className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                    >
                      <option value="">None</option>
                      {getMilestonesByProject(projectId).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Estimate (hours)
                    </div>
                    <Input
                      value={editEstimate}
                      onChange={(e) => setEditEstimate(e.target.value)}
                      placeholder="e.g. 3.5"
                    />
                  </div>
                </>
              )}
              {projectId && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Time Tracking
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <span className="px-2 py-1 rounded bg-accent/50 font-medium">
                      Est:{" "}
                      {typeof detailTask.estimateHours === "number"
                        ? detailTask.estimateHours
                        : 0}
                      h
                    </span>
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                      Logged:{" "}
                      {typeof detailTask.loggedHours === "number"
                        ? detailTask.loggedHours
                        : 0}
                      h
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-medium">Quick Log Time:</div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Log hours (e.g. 1.25)"
                        value={timeLogInput}
                        onChange={(e) => setTimeLogInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleLogTime();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleLogTime}
                        disabled={!timeLogInput.trim()}
                      >
                        Log
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewLogsOpen(true)}
                      >
                        View Logs ({getTimeLogsForTask(detailTask.id).length})
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              {editMode ? (
                <>
                  <Button variant="outline" size="sm" onClick={cancelEditTask}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveTaskEdit}
                    disabled={!editTitle.trim()}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDetailOpen(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        open={!!deleteTaskConfirm}
        onOpenChange={(open) => !open && setDeleteTaskConfirm(null)}
        size="sm"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delete Task</h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteTaskConfirm?.title}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTaskConfirm(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteTask}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Time Logs Modal */}
      <Modal open={viewLogsOpen} onOpenChange={setViewLogsOpen} size="md">
        {detailTask && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Time Logs for {detailTask.title}
            </h3>
            {(() => {
              const logs = getTimeLogsForTask(detailTask.id);
              if (logs.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No time logs for this task yet.
                  </p>
                );
              }
              return (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border rounded-lg bg-accent/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {log.hours}h
                          </span>
                          {log.loggedBy && (
                            <span className="text-xs text-muted-foreground">
                              by {log.loggedBy}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.loggedAt).toLocaleString()}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-sm text-muted-foreground">
                          {log.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewLogsOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Card Confirmation Modal */}
      <Modal
        open={!!deleteCardConfirm}
        onOpenChange={(open) => !open && setDeleteCardConfirm(null)}
        size="sm"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delete Task</h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteCardConfirm?.taskTitle}</strong>? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteCardConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                deleteCardConfirm &&
                deleteTask(deleteCardConfirm.columnId, deleteCardConfirm.taskId)
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
