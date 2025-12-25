"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getMilestonesByProject, upsertTask } from "@/lib/utils";

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
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskAssignee, setNewTaskAssignee] = React.useState("You");
  const [newTaskDue, setNewTaskDue] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState("medium");
  const [newTaskMilestone, setNewTaskMilestone] = React.useState("");

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
      setNewTaskMilestone("");
    }
  }, [open]);

  const handleCreate = () => {
    if (!projectId || !newTaskTitle.trim()) return;
    try {
      const id = `task-${Date.now()}`;
      upsertTask({
        id,
        projectId: projectId,
        title: newTaskTitle.trim(),
        status: "todo",
        assignee: newTaskAssignee || "You",
        due: newTaskDue,
        priority: newTaskPriority as any,
        milestoneId: newTaskMilestone || undefined,
      });
      showToast("Task created", "success");
      setOpen(false);
    } catch {
      showToast("Failed to create task", "error");
    }
  };

  return (
    <Modal open={open} onOpenChange={setOpen} size="lg">
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Create Task</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title
            </label>
            <input
              id="task-title"
              name="taskTitle"
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g., Draft project plan"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="task-assignee" className="text-sm font-medium">
              Assignee
            </label>
            <select
              id="task-assignee"
              name="taskAssignee"
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
            >
              <option value="You">You</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="task-due" className="text-sm font-medium">
              Due Date
            </label>
            <input
              id="task-due"
              name="taskDue"
              type="date"
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="task-priority" className="text-sm font-medium">
              Priority
            </label>
            <select
              id="task-priority"
              name="taskPriority"
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {projectId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Milestone</label>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={newTaskMilestone}
                onChange={(e) => setNewTaskMilestone(e.target.value)}
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
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={!newTaskTitle.trim()}
          >
            Create Task
          </Button>
        </div>
      </div>
    </Modal>
  );
}
