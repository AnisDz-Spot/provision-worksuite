"use client";

import React from "react";
import { CalendarDays, Edit2, Trash2, Save, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { cn } from "@/lib/utils";

type TaskDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  projectId?: string;
  isAuthorized: boolean;
  memberList: any[];
  priorityColors: Record<string, string>;
  editMode: boolean;
  setEditMode: (val: boolean) => void;
  startEditTask: (task: any) => void;
  saveTaskEdit: () => void;
  cancelEditTask: () => void;
  setDeleteTaskConfirm: (val: any) => void;

  editTitle: string;
  setEditTitle: (val: string) => void;
  editAssignee: string;
  setEditAssignee: (val: string) => void;
  editDue: string;
  setEditDue: (val: string) => void;
  editPriority: string;
  setEditPriority: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editLabels: string;
  setEditLabels: (val: string) => void;
  editEstimate: string;
  setEditEstimate: (val: string) => void;
  editMilestone: string;
  setEditMilestone: (val: string) => void;

  milestones: any[];
  timeLogInput: string;
  setTimeLogInput: (val: string) => void;
  timeLogNote: string;
  setTimeLogNote: (val: string) => void;
  handleLogTime: () => void;
  getTimeLogsCount: (taskId: string) => number;
  onViewLogs: () => void;
  getAvatarColorClass: (color?: string) => string;
};

export function TaskDetailsModal({
  isOpen,
  onClose,
  task,
  projectId,
  isAuthorized,
  memberList,
  priorityColors,
  editMode,
  setEditMode,
  startEditTask,
  saveTaskEdit,
  cancelEditTask,
  setDeleteTaskConfirm,
  editTitle,
  setEditTitle,
  editAssignee,
  setEditAssignee,
  editDue,
  setEditDue,
  editPriority,
  setEditPriority,
  editDescription,
  setEditDescription,
  editLabels,
  setEditLabels,
  editEstimate,
  setEditEstimate,
  editMilestone,
  setEditMilestone,
  milestones,
  timeLogInput,
  setTimeLogInput,
  timeLogNote,
  setTimeLogNote,
  handleLogTime,
  getTimeLogsCount,
  onViewLogs,
  getAvatarColorClass,
}: TaskDetailsModalProps) {
  if (!task) return null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setEditMode(false);
          onClose();
        }
      }}
      size="lg"
      className="md:min-w-[40vw]"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {editMode ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold"
            />
          ) : (
            <h3 className="text-2xl font-bold">{task.title}</h3>
          )}
          {!editMode && projectId && isAuthorized && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEditTask(task)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  setDeleteTaskConfirm({
                    id: task.id,
                    title: task.title,
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
                      const m = memberList.find((u) => u.name === editAssignee);
                      const cls = getAvatarColorClass((m as any)?.avatarColor);
                      return (
                        <>
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              cls
                            )}
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
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        getAvatarColorClass((m as any).avatarColor)
                      )}
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
                  src={
                    task.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assignee || "U")}`
                  }
                  alt={task.assignee}
                  className="w-10 h-10 rounded-full"
                />
                <div className="font-medium">{task.assignee}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Due Date</div>
              {editMode ? (
                <Input
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{task.due}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Priority</div>
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
                    className={cn(
                      priorityColors[task.priority],
                      "w-3 h-3 rounded-full"
                    )}
                  />
                  <span className="font-medium capitalize">
                    {task.priority}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="text-xs text-muted-foreground mb-1">
              Description
            </div>
            {editMode ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Detailed description..."
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-24"
              />
            ) : (
              <div className="text-sm border border-border rounded-md p-3 bg-accent/5 overflow-auto max-h-48 whitespace-pre-wrap">
                {task.description || (
                  <span className="text-muted-foreground italic">
                    No description provided.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Labels</div>
            {editMode ? (
              <Input
                value={editLabels}
                onChange={(e) => setEditLabels(e.target.value)}
                placeholder="e.g. bug, high-priority (comma separated)"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.labels && task.labels.length > 0 ? (
                  task.labels.map((label: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    No labels
                  </span>
                )}
              </div>
            )}
          </div>

          {projectId && editMode && (
            <div className="grid grid-cols-2 gap-4">
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
                  {milestones.map((m) => (
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
            </div>
          )}

          {projectId && !editMode && (
            <div className="pt-4 border-t border-border mt-4">
              <div className="text-xs text-muted-foreground mb-2">
                Time Tracking
              </div>
              <div className="flex items-center gap-3 text-sm mb-4">
                <span className="px-2 py-1 rounded bg-accent/50 font-medium">
                  Est:{" "}
                  {typeof task.estimateHours === "number"
                    ? task.estimateHours
                    : 0}
                  h
                </span>
                <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                  Logged:{" "}
                  {typeof task.loggedHours === "number" ? task.loggedHours : 0}h
                </span>
              </div>
              <div className="space-y-3 p-4 bg-secondary/10 rounded-xl border border-border/50">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                  <span>Log Time</span>
                  <span className="text-destructive font-normal">
                    *Required
                  </span>
                </div>
                <div className="space-y-3">
                  <Input
                    placeholder="Hours (e.g. 1.25)"
                    value={timeLogInput}
                    onChange={(e) => setTimeLogInput(e.target.value)}
                  />
                  <textarea
                    placeholder="What did you work on? (required)"
                    className={cn(
                      "w-full rounded-md border bg-background px-3 py-2 text-sm min-h-16 resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
                      !timeLogNote.trim() && timeLogInput.trim()
                        ? "border-destructive/50"
                        : "border-input"
                    )}
                    value={timeLogNote}
                    onChange={(e) => setTimeLogNote(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleLogTime}
                      disabled={!timeLogInput.trim() || !timeLogNote.trim()}
                    >
                      Log Time
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onViewLogs}
                    >
                      View Logs ({getTimeLogsCount(task.id)})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
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
            <Button variant="primary" size="sm" onClick={() => onClose()}>
              Close
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
