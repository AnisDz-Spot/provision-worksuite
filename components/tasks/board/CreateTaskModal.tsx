"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";

type CreateTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  newTaskTitle: string;
  setNewTaskTitle: (val: string) => void;
  newTaskAssignee: string;
  setNewTaskAssignee: (val: string) => void;
  newTaskDue: string;
  setNewTaskDue: (val: string) => void;
  newTaskPriority: string;
  setNewTaskPriority: (val: string) => void;
  newTaskEstimate: string;
  setNewTaskEstimate: (val: string) => void;
  newTaskDescription: string;
  setNewTaskDescription: (val: string) => void;
  newTaskLabels: string;
  setNewTaskLabels: (val: string) => void;
  newTaskType: string;
  setNewTaskType: (val: string) => void;
  milestoneId: string;
  setMilestoneId: (val: string) => void;
  memberList: any[];
  projectId?: string;
  milestones: any[];
  addTask: () => void;
  getAvatarColorClass: (color?: string) => string;
};

export function CreateTaskModal({
  isOpen,
  onClose,
  newTaskTitle,
  setNewTaskTitle,
  newTaskAssignee,
  setNewTaskAssignee,
  newTaskDue,
  setNewTaskDue,
  newTaskPriority,
  setNewTaskPriority,
  newTaskEstimate,
  setNewTaskEstimate,
  newTaskDescription,
  setNewTaskDescription,
  newTaskLabels,
  setNewTaskLabels,
  newTaskType,
  setNewTaskType,
  milestoneId,
  setMilestoneId,
  memberList,
  projectId,
  milestones,
  addTask,
  getAvatarColorClass,
}: CreateTaskModalProps) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
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
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                            cls
                          )}
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
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      getAvatarColorClass((m as any).avatarColor)
                    )}
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
                {milestones.map((m) => (
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
          <div className="space-y-3 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Detailed description..."
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-24"
            />
          </div>
          <div className="space-y-3 md:col-span-2">
            <label className="text-sm font-medium">
              Labels (comma separated)
            </label>
            <Input
              value={newTaskLabels}
              onChange={(e) => setNewTaskLabels(e.target.value)}
              placeholder="e.g. bug, high-priority, frontend"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
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
  );
}
