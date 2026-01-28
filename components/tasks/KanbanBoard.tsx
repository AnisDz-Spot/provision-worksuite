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
import { loadTasks, saveTasks, Task } from "@/lib/data";
import { useRevalidatedData } from "@/hooks/useRevalidatedData";
import { Skeleton } from "@/components/ui/Skeleton";
import { BoardColumn } from "./board/BoardColumn";
import { CreateTaskModal } from "./board/CreateTaskModal";
import { TaskDetailsModal } from "./board/TaskDetailsModal";
import { TimeLogsModal } from "./board/TimeLogsModal";
import { ConfirmModal } from "./board/ConfirmModal";
import { shouldUseMockData } from "@/lib/dataSource";

const MOCK_BOARD = [
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
];

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
};

type KanbanBoardProps = {
  projectId?: string;
  projectUid?: string;
  projectMembers?: {
    id?: string;
    uid?: string;
    name: string;
    avatarUrl?: string;
  }[];
  onTaskUpdate?: () => void;
};

export function KanbanBoard({
  projectId,
  projectUid,
  projectMembers = [],
  onTaskUpdate,
}: KanbanBoardProps) {
  const { startTimer } = useTimeTracker();
  const { show } = useToaster();

  // State
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("You");
  const [newTaskDue, setNewTaskDue] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
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
  const [editType, setEditType] = useState("feature");
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
  const [milestones, setMilestones] = useState<any[]>([]);

  // Data Fetching
  const {
    data: allTasks,
    loading: isLoading,
    refresh: refreshTasks,
    setData: setAllTasks,
  } = useRevalidatedData<Task[]>(loadTasks, {
    persistKey: "tasks",
  });

  useEffect(() => {
    const fetchMilestones = () => {
      if (projectId) {
        getMilestonesByProject(projectId).then(setMilestones);
      }
    };
    fetchMilestones();
    window.addEventListener("pv:milestonesUpdated", fetchMilestones);
    return () =>
      window.removeEventListener("pv:milestonesUpdated", fetchMilestones);
  }, [projectId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentUser(data.user);
      })
      .catch((err) => console.error("Error fetching user:", err));

    // Listen for task updates
    const handleTaskUpdate = () => refreshTasks();
    window.addEventListener("pv:tasksUpdated", handleTaskUpdate);
    return () =>
      window.removeEventListener("pv:tasksUpdated", handleTaskUpdate);
  }, [refreshTasks]);

  // Derived State
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    const role = currentUser.role?.toLowerCase() || "";
    return (
      ["admin", "administrator", "master admin", "project manager"].includes(
        role,
      ) || currentUser.uid === "admin-global"
    );
  }, [currentUser]);

  const memberList = useMemo(() => {
    const list =
      projectMembers && projectMembers.length > 0
        ? projectMembers.map((m) => ({
            id: m.uid || m.id || m.name,
            name: m.name,
          }))
        : shouldUseMockData()
          ? (users as any)
          : [];

    // Ensure current user is in identifying name for "You" mapping
    return list;
  }, [projectMembers]);

  const columns = useMemo(() => {
    if (!allTasks && !shouldUseMockData()) return MOCK_BOARD;

    const tasks = (allTasks || [])
      .filter(
        (t: any) =>
          !projectId ||
          t.projectId === projectId ||
          t.projectId === projectUid ||
          (shouldUseMockData() && !t.projectId),
      )
      .map((t: any) => ({
        id: t.uid || t.id,
        projectId: t.projectId,
        title: t.title,
        status: t.status as any,
        assignee: t.assignee?.name || t.assignee || "Unassigned",
        due:
          t.dueDate || t.due
            ? new Date(t.dueDate || t.due).toISOString().split("T")[0]
            : "",
        priority: t.priority as any,
        estimateHours: t.estimateHours,
        loggedHours: t.loggedHours,
        milestoneId: t.milestoneId,
        description: t.description || "",
        labels: t.labels || [],
      }));

    const msLookup = new Map<string, string>();
    milestones.forEach((m) => msLookup.set(m.id, m.title));

    const toCardTask = (t: any) => ({
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

    return [
      {
        id: "todo",
        title: "Todo",
        color: "border-slate-400",
        bgColor: "bg-slate-50 dark:bg-slate-900/30",
        tasks: tasks
          .filter((t: any) => statusMap[t.status] === "todo")
          .map(toCardTask),
      },
      {
        id: "in-progress",
        title: "In Progress",
        color: "border-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/30",
        tasks: tasks
          .filter((t: any) => statusMap[t.status] === "in-progress")
          .map(toCardTask),
      },
      {
        id: "review",
        title: "Review",
        color: "border-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/30",
        tasks: tasks
          .filter((t: any) => statusMap[t.status] === "review")
          .map(toCardTask),
      },
      {
        id: "done",
        title: "Done",
        color: "border-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/30",
        tasks: tasks
          .filter((t: any) => statusMap[t.status] === "done")
          .map(toCardTask),
      },
    ];
  }, [allTasks, projectId, projectUid, milestones]);

  const assignees = useMemo(() => {
    const list = new Set<string>(["You"]);
    const currentUserName = currentUser?.name;

    projectMembers.forEach((m) => {
      if (currentUserName && m.name === currentUserName) return;
      list.add(m.name);
    });

    columns.forEach((c) =>
      c.tasks.forEach((t) => {
        if (
          t.assignee &&
          t.assignee !== "Unassigned" &&
          t.assignee !== "You" &&
          t.assignee !== currentUserName
        ) {
          list.add(t.assignee);
        }
      }),
    );
    return Array.from(list);
  }, [columns, projectMembers, currentUser]);

  // Handlers
  const onDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    colId: string,
    taskId: string,
  ) => {
    setDraggedTask(taskId);
    e.dataTransfer.setData("text/plain", JSON.stringify({ colId, taskId }));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragEnd = () => setDraggedTask(null);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetColId: string) => {
    if (!isAuthorized) {
      show(
        "error",
        "Unauthorized: Only admins and project managers can manage tasks",
      );
      return;
    }
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");
    if (!text) return;

    try {
      const { colId, taskId } = JSON.parse(text);
      if (colId === targetColId) return;

      const taskToMove = allTasks?.find(
        (t: any) => (t.uid || t.id) === taskId,
      ) as any;
      if (!taskToMove || !projectId) return;

      const updated: TaskItem = {
        id: taskId,
        projectId,
        title: taskToMove.title,
        status: targetColId as any,
        assignee:
          taskToMove.assignee?.name || taskToMove.assignee || "Unassigned",
        due: taskToMove.dueDate || taskToMove.due,
        priority: taskToMove.priority as any,
        milestoneId: taskToMove.milestoneId || undefined,
      };

      const doUpdate = async () => {
        // Optimistic update
        if (allTasks) {
          const nextTasks = allTasks.map((t: any) =>
            (t.uid || t.id) === taskId ? { ...t, status: targetColId } : t,
          );
          setAllTasks(nextTasks);
        }

        try {
          if (!shouldUseMockData()) {
            await saveTasks([updated as any]);
          } else {
            upsertTask(updated);
          }
          // No need for a full refresh if we updated state correctly
          onTaskUpdate?.();
        } catch (err) {
          show("error", "Failed to move task");
          // Revert on error
          if (allTasks) setAllTasks(allTasks);
        }
      };

      doUpdate();
    } catch (err) {
      console.error("Drop error:", err);
    } finally {
      setDraggedTask(null);
    }
  };

  const openAddModal = (columnId: string) => {
    setTargetColumn(columnId);
    setNewTaskTitle("");
    setNewTaskAssignee("You");
    setNewTaskDue(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    );
    setNewTaskPriority("medium");
    setNewTaskEstimate("");
    setNewTaskType("feature");
    setMilestoneId("");
    setModalOpen(true);
  };

  const startEditTask = (task: any) => {
    setDetailTask(task);
    setEditMode(true);
    setEditTitle(task.title);
    setEditAssignee(task.assignee);
    setEditDue(task.due);
    setEditPriority(task.priority);
    setEditEstimate(
      task.estimateHours != null ? task.estimateHours.toString() : "",
    );
    setEditMilestone(task.milestoneId || "");
    setEditDescription(task.description || "");
    setEditLabels(Array.isArray(task.labels) ? task.labels.join(", ") : "");
    setEditType(task.type || "feature");
  };

  const saveTaskEdit = async () => {
    if (!detailTask || !projectId || !editTitle.trim()) return;

    const updated: TaskItem = {
      id: detailTask.id,
      projectId,
      title: editTitle.trim(),
      status: (detailTask.status || "todo") as any,
      assignee: editAssignee,
      due: editDue,
      priority: editPriority as any,
      milestoneId: editMilestone || undefined,
      estimateHours: editEstimate ? parseFloat(editEstimate) : undefined,
      loggedHours: detailTask.loggedHours || 0,
      description: editDescription,
      labels: editLabels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      type: editType,
    };

    try {
      if (!shouldUseMockData()) {
        await saveTasks([updated as any]);
      } else {
        upsertTask(updated);
      }
      await refreshTasks();
      show("success", "Task updated successfully");
      onTaskUpdate?.();
      setEditMode(false);
    } catch (err) {
      show("error", "Failed to update task");
    }
  };

  const confirmDeleteTask = async () => {
    if (!detailTask) return;
    try {
      removeTask(detailTask.id);
      await refreshTasks();
      setDeleteTaskConfirm(null);
      setDetailOpen(false);
      show("success", "Task deleted successfully");
      onTaskUpdate?.();
    } catch (err) {
      show("error", "Failed to delete task");
    }
  };

  const handleLogTime = async () => {
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

    // Show loading state immediately
    const loadingToast = show("info", "Logging time...");

    // Optimistically update the UI
    const previousLoggedHours = detailTask.loggedHours || 0;
    const optimisticLoggedHours = previousLoggedHours + value;

    // Update local state immediately for instant feedback
    setAllTasks((prev: Task[] | null) => {
      if (!prev) return prev;
      return prev.map((t: Task) =>
        t.id === detailTask.id
          ? { ...t, loggedHours: optimisticLoggedHours }
          : t,
      );
    });

    // Also update the detail task to reflect changes immediately
    setDetailTask((prev: any) => ({
      ...prev,
      loggedHours: optimisticLoggedHours,
    }));

    try {
      const result = await addTimeLog(
        detailTask.id,
        projectId,
        value,
        timeLogNote.trim(),
        detailTask.assignee,
      );

      if (result) {
        show("success", `Logged ${value} hours`);
        setTimeLogInput("");
        setTimeLogNote("");

        // Refresh only the task data, not the entire component
        await refreshTasks();
        window.dispatchEvent(new Event("pv:timeUpdated"));
        onTaskUpdate?.();
      } else {
        // Revert optimistic update on failure
        setAllTasks((prev: Task[] | null) => {
          if (!prev) return prev;
          return prev.map((t: Task) =>
            t.id === detailTask.id
              ? { ...t, loggedHours: previousLoggedHours }
              : t,
          );
        });
        setDetailTask((prev: any) => ({
          ...prev,
          loggedHours: previousLoggedHours,
        }));
        show("error", "Failed to log time");
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setAllTasks((prev: Task[] | null) => {
        if (!prev) return prev;
        return prev.map((t: Task) =>
          t.id === detailTask.id
            ? { ...t, loggedHours: previousLoggedHours }
            : t,
        );
      });
      setDetailTask((prev: any) => ({
        ...prev,
        loggedHours: previousLoggedHours,
      }));

      // Show specific error message if available
      const errorMessage = error?.message || "Failed to log time";
      show("error", errorMessage);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim() || !targetColumn || !projectId) return;

    const id = `task-${Date.now()}`;
    const t: TaskItem = {
      id,
      projectId,
      title: newTaskTitle.trim(),
      status: targetColumn as any,
      assignee: newTaskAssignee,
      due: newTaskDue,
      priority: newTaskPriority as any,
      milestoneId: milestoneId || undefined,
      estimateHours: newTaskEstimate ? parseFloat(newTaskEstimate) : undefined,
      loggedHours: 0,
      type: newTaskType,
      description: newTaskDescription,
      labels: newTaskLabels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    };

    try {
      if (!shouldUseMockData()) {
        await saveTasks([t as any]);
      } else {
        upsertTask(t);
      }
      await refreshTasks();
      onTaskUpdate?.();
      setModalOpen(false);
    } catch (err) {
      show("error", "Failed to add task");
    }
  };

  const deleteTask = async (columnId: string, taskId: string) => {
    if (!projectId) return;
    try {
      removeTask(taskId);
      await refreshTasks();
      onTaskUpdate?.();
    } finally {
      setDeleteCardConfirm(null);
    }
  };

  const checkIsBlocked = (taskId: string) => {
    if (!projectId) return false;
    try {
      const incompletes = getIncompleteDependencyIds(projectId);
      return incompletes.includes(taskId);
    } catch {
      return false;
    }
  };

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

  return (
    <>
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
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <label className="text-sm">Milestone</label>
          <select
            value={filterMilestone}
            onChange={(e) => setFilterMilestone(e.target.value)}
            className="rounded-md border border-border bg-card text-foreground px-2 py-1 text-sm min-w-32"
          >
            <option value="all">All</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <div className="flex-1" />

          <Button
            variant={selectMode ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedIds(new Set());
            }}
          >
            {selectMode ? "Exit Selection" : "Bulk Actions"}
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
            Reset
          </Button>
        </div>

        {selectMode && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium">
              {selectedIds.size} tasks selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allIds = columns.flatMap((c) => c.tasks.map((t) => t.id));
                setSelectedIds(new Set(allIds));
              }}
            >
              Select All
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={async () => {
                if (confirm(`Delete ${selectedIds.size} tasks?`)) {
                  for (const id of selectedIds) {
                    removeTask(id);
                  }
                  await refreshTasks();
                  setSelectedIds(new Set());
                  show("success", `Deleted ${selectedIds.size} tasks`);
                }
              }}
            >
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      <div className="flex overflow-x-auto pb-4 gap-6 snap-x md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
        {isLoading && !allTasks ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[85vw] md:min-w-0 space-y-4">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ))}
          </>
        ) : (
          columns
            .filter((c) =>
              filterStatus === "all" ? true : c.id === filterStatus,
            )
            .map((col) => (
              <div key={col.id} className="min-w-[85vw] md:min-w-0 snap-center">
                <BoardColumn
                  col={col}
                  filterAssignee={filterAssignee}
                  filterMilestone={filterMilestone}
                  isAuthorized={isAuthorized}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  draggedTask={draggedTask}
                  priorityColors={priorityColors}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onTaskClick={(task) => {
                    if (selectMode) {
                      const next = new Set(selectedIds);
                      if (next.has(task.id)) {
                        next.delete(task.id);
                      } else {
                        next.add(task.id);
                      }
                      setSelectedIds(next);
                    } else {
                      setDetailTask(task);
                      setDetailOpen(true);
                    }
                  }}
                  onSelectToggle={(taskId, selected) => {
                    const next = new Set(selectedIds);
                    if (selected) next.add(taskId);
                    else next.delete(taskId);
                    setSelectedIds(next);
                  }}
                  onDeleteTaskClick={(colId, tId, tTitle) => {
                    setDeleteCardConfirm({
                      columnId: colId,
                      taskId: tId,
                      taskTitle: tTitle,
                    });
                  }}
                  onAddTaskClick={openAddModal}
                  checkIsBlocked={checkIsBlocked}
                />
              </div>
            ))
        )}
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
        milestones={milestones}
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
        cancelEditTask={() => setEditMode(false)}
        setDeleteTaskConfirm={setDeleteTaskConfirm}
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
        editType={editType}
        setEditType={setEditType}
        milestones={milestones}
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
