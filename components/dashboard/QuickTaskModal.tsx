"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import { upsertTask, getMilestonesByProject } from "@/lib/utils";
import { shouldUseMockData } from "@/lib/dataSource";
import { CreateTaskModal } from "@/components/tasks/board/CreateTaskModal";
import { saveTasks } from "@/lib/data";
import { useLoading } from "@/context/LoadingContext";

interface QuickTaskModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projectId: string | null;
  teamMembers: Array<{
    id?: string;
    uid?: string;
    name: string;
    avatarUrl?: string;
  }>;
}

export function QuickTaskModal({
  open,
  setOpen,
  projectId,
  teamMembers,
}: QuickTaskModalProps) {
  const { showToast } = useToast();
  const { showLoader, hideLoader } = useLoading();
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskAssignee, setNewTaskAssignee] = React.useState("You");
  const [newTaskDue, setNewTaskDue] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState("medium");
  const [newTaskEstimate, setNewTaskEstimate] = React.useState("");
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [newTaskLabels, setNewTaskLabels] = React.useState("");
  const [newTaskType, setNewTaskType] = React.useState("feature");
  const [milestoneId, setMilestoneId] = React.useState("");
  const [milestones, setMilestones] = React.useState<any[]>([]);

  // Transform teamMembers to match memberList prop
  const memberList = React.useMemo(() => {
    return [
      { id: "current", name: "You" },
      ...teamMembers.map((m) => ({
        id: m.uid || m.id || m.name,
        name: m.name,
        avatarColor: undefined, // or derive if needed
      })),
    ];
  }, [teamMembers]);

  React.useEffect(() => {
    if (projectId) {
      getMilestonesByProject(projectId).then(setMilestones);
    } else {
      setMilestones([]);
    }
  }, [projectId]);

  React.useEffect(() => {
    if (open) {
      setNewTaskTitle("");
      setNewTaskAssignee("You");
      setNewTaskDue(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)
      );
      setNewTaskPriority("medium");
      setNewTaskEstimate("");
      setNewTaskDescription("");
      setNewTaskLabels("");
      setNewTaskType("feature");
      setMilestoneId("");
    }
  }, [open]);

  const getAvatarColorClass = (color?: string) => {
    // Simple helper since we don't have access to the one in KanbanBoard
    // but CreateTaskModal expects it.
    switch (color) {
      case "indigo":
        return "bg-indigo-500/10 text-indigo-600";
      case "green":
        return "bg-green-500/10 text-green-600";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  const handleCreate = async () => {
    if (!projectId || !newTaskTitle.trim()) return;

    try {
      showLoader("Creating task...");
      const id = `task-${Date.now()}`;

      const taskData = {
        id,
        projectId: projectId,
        title: newTaskTitle.trim(),
        status: "todo" as const,
        assignee: newTaskAssignee,
        due: newTaskDue,
        priority: newTaskPriority as "low" | "medium" | "high",
        milestoneId: milestoneId || undefined,
        estimateHours: newTaskEstimate
          ? parseFloat(newTaskEstimate)
          : undefined,
        description: newTaskDescription,
        labels: newTaskLabels
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        boardColumn: "todo",
        loggedHours: 0,
      };

      if (!shouldUseMockData()) {
        // Live Mode: Use API
        const success = await saveTasks([taskData as any]);
        if (success) {
          showToast("Task created successfully", "success");
          setOpen(false);
          // Optional: trigger refresh if needed
        } else {
          showToast("Failed to create task", "error");
        }
      } else {
        // Mock Mode: Local Storage
        upsertTask(taskData);
        showToast("Task created (Mock)", "success");
        setOpen(false);
      }
    } catch (e) {
      console.error(e);
      showToast("An error occurred", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <CreateTaskModal
      isOpen={open}
      onClose={() => setOpen(false)}
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
      projectId={projectId || undefined}
      milestones={milestones}
      addTask={handleCreate}
      getAvatarColorClass={getAvatarColorClass}
    />
  );
}
