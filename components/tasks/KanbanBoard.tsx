"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
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
import { BoardColumn } from "./board/BoardColumn";
import { CreateTaskModal } from "./board/CreateTaskModal";
import { TaskDetailsModal } from "./board/TaskDetailsModal";
import { TimeLogsModal } from "./board/TimeLogsModal";
import { ConfirmModal } from "./board/ConfirmModal";

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
  const [newTaskDescription, setNewTaskDescription] = useState<string>("");
  const [newTaskLabels, setNewTaskLabels] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [editDescription, setEditDescription] = useState("");
  const [editLabels, setEditLabels] = useState("");
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
  const [timeLogNote, setTimeLogNote] = useState("");
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
          description: t.description || "",
          labels: t.labels || [],
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
      description: t.description || "",
      labels: t.labels || [],
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
  }, [projectId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentUser(data.user);
      })
      .catch((err) => console.error("Error fetching user:", err));
  }, []);

  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role?.toLowerCase() || "";
    return (
      ["admin", "administrator", "master admin", "project manager"].includes(
        role
      ) || currentUser.uid === "admin-global"
    );
  }, [currentUser]);

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
    if (!isAuthorized) {
      show(
        "error",
        "Unauthorized: Only admins and project managers can manage tasks"
      );
      return;
    }
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
    setEditDescription(task.description || "");
    setEditLabels(Array.isArray(task.labels) ? task.labels.join(", ") : "");
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
      description: editDescription,
      labels: editLabels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
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

  async function handleLogTime() {
    if (!detailTask || !projectId || !timeLogInput.trim()) return;
    const value = parseFloat(timeLogInput);
    if (isNaN(value) || value <= 0) {
      show("error", "Please enter a valid number of hours");
      return;
    }
    if (!timeLogNote.trim()) {
      show("error", "Please enter a note for this time log");
      return;
    }
    const result = await addTimeLog(
      detailTask.id,
      projectId,
      value,
      timeLogNote.trim(),
      detailTask.assignee
    );
    if (result) {
      show("success", `Logged ${value} hours`);
      setTimeLogInput("");
      setTimeLogNote("");

      // Update detailTask state immediately if possible
      setDetailTask({
        ...detailTask,
        loggedHours: parseFloat(
          ((detailTask.loggedHours || 0) + value).toFixed(2)
        ),
      });

      refreshFromStorage();
      window.dispatchEvent(new Event("pv:timeUpdated"));
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
        title: newTaskTitle.trim(),
        status: targetColumn as TaskItem["status"],
        assignee: newTaskAssignee,
        due: newTaskDue,
        priority: newTaskPriority as "high" | "medium" | "low",
        milestoneId: milestoneId || undefined,
        estimateHours: newTaskEstimate
          ? parseFloat(newTaskEstimate)
          : undefined,
        loggedHours: 0,
        description: newTaskDescription,
        labels: newTaskLabels
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
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
          <BoardColumn
            key={col.id}
            col={col}
            filterAssignee={filterAssignee}
            filterMilestone={filterMilestone}
            isAuthorized={isAuthorized}
            selectMode={selectMode}
            selectedIds={selectedIds}
            draggedTask={draggedTask}
            priorityColors={priorityColors}
            isBlocked={false} // Placeholder, will fix below
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTaskClick={(task: any) => {
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
            onSelectToggle={(taskId: string, selected: boolean) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (selected) next.add(taskId);
                else next.delete(taskId);
                return next;
              });
            }}
            onDeleteTaskClick={(
              columnId: string,
              taskId: string,
              taskTitle: string
            ) => {
              setDeleteCardConfirm({ columnId, taskId, taskTitle });
            }}
            onAddTaskClick={openAddModal}
            checkIsBlocked={(taskId: string) => {
              if (!projectId) return false;
              // Project dependency check
              const incomplete = getIncompleteDependencyIds(projectId);
              return incomplete.length > 0;
            }}
          />
        ))}
      </div>

      <CreateTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newTaskAssignee={newTaskAssignee}
        setNewTaskAssignee={setNewTaskAssignee}
        newTaskDue={newTaskDue}
        setNewTaskDue={setNewTaskDue}
        newTaskPriority={newTaskPriority}
        setNewTaskPriority={setNewTaskPriority}
        newTaskEstimate={newTaskEstimate}
        setNewTaskEstimate={setNewTaskEstimate}
        newTaskDescription={newTaskDescription}
        setNewTaskDescription={setNewTaskDescription}
        newTaskLabels={newTaskLabels}
        setNewTaskLabels={setNewTaskLabels}
        newTaskType={newTaskType}
        setNewTaskType={setNewTaskType}
        milestoneId={milestoneId}
        setMilestoneId={setMilestoneId}
        memberList={memberList}
        projectId={projectId}
        milestones={projectId ? getMilestonesByProject(projectId) : []}
        addTask={addTask}
        getAvatarColorClass={getAvatarColorClass}
      />

      <TaskDetailsModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        task={detailTask}
        projectId={projectId}
        isAuthorized={isAuthorized}
        memberList={memberList}
        priorityColors={priorityColors}
        editMode={editMode}
        setEditMode={setEditMode}
        startEditTask={startEditTask}
        saveTaskEdit={saveTaskEdit}
        cancelEditTask={cancelEditTask}
        setDeleteTaskConfirm={(confirmed: any) => {
          setDeleteTaskConfirm(confirmed);
        }}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editAssignee={editAssignee}
        setEditAssignee={setEditAssignee}
        editDue={editDue}
        setEditDue={setEditDue}
        editPriority={editPriority}
        setEditPriority={setEditPriority}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editLabels={editLabels}
        setEditLabels={setEditLabels}
        editEstimate={editEstimate}
        setEditEstimate={setEditEstimate}
        editMilestone={editMilestone}
        setEditMilestone={setEditMilestone}
        milestones={projectId ? getMilestonesByProject(projectId) : []}
        timeLogInput={timeLogInput}
        setTimeLogInput={setTimeLogInput}
        timeLogNote={timeLogNote}
        setTimeLogNote={setTimeLogNote}
        handleLogTime={handleLogTime}
        getTimeLogsCount={(taskId: string) => getTimeLogsForTask(taskId).length}
        onViewLogs={() => setViewLogsOpen(true)}
        getAvatarColorClass={getAvatarColorClass}
      />

      <ConfirmModal
        isOpen={!!deleteTaskConfirm}
        onClose={() => setDeleteTaskConfirm(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>{deleteTaskConfirm?.title}</strong>? This action cannot be
            undone.
          </>
        }
      />

      <TimeLogsModal
        isOpen={viewLogsOpen}
        onClose={() => setViewLogsOpen(false)}
        task={detailTask}
        logs={detailTask ? getTimeLogsForTask(detailTask.id) : []}
      />

      <ConfirmModal
        isOpen={!!deleteCardConfirm}
        onClose={() => setDeleteCardConfirm(null)}
        onConfirm={() => {
          if (deleteCardConfirm) {
            deleteTask(deleteCardConfirm.columnId, deleteCardConfirm.taskId);
          }
        }}
        title="Delete Task"
        message={
          <>
            Are you sure you want to delete{" "}
            <strong>{deleteCardConfirm?.taskTitle}</strong>? This action cannot
            be undone.
          </>
        }
      />
    </>
  );
}
