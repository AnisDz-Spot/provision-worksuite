"use client";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CalendarDays, Flag, Trash2, Plus, Save, Edit2, X } from "lucide-react";
import {
  Milestone,
  getMilestonesByProject,
  upsertMilestone,
  deleteMilestone,
  getMilestoneTaskProgress,
} from "@/lib/utils";
import { useToaster } from "@/components/ui/Toaster";

export function ProjectMilestones({ projectId }: { projectId: string }) {
  const { show } = useToaster();
  const [items, setItems] = React.useState<Milestone[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [start, setStart] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editStart, setEditStart] = React.useState("");
  const [editTarget, setEditTarget] = React.useState("");
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  const refresh = React.useCallback(() => {
    setItems(getMilestonesByProject(projectId));
  }, [projectId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const onAdd = () => {
    if (!title.trim()) return;
    const m: Milestone = {
      id: `m_${Date.now()}`,
      projectId,
      title: title.trim(),
      start: start || undefined,
      target: target || undefined,
    };
    upsertMilestone(m);
    setTitle("");
    setStart("");
    setTarget("");
    setAdding(false);
    refresh();
    show("success", "Milestone created successfully");
  };

  const startEdit = (m: Milestone) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditStart(m.start || "");
    setEditTarget(m.target || "");
  };

  const saveEdit = () => {
    if (!editingId || !editTitle.trim()) return;
    const m: Milestone = {
      id: editingId,
      projectId,
      title: editTitle.trim(),
      start: editStart || undefined,
      target: editTarget || undefined,
    };
    upsertMilestone(m);
    setEditingId(null);
    refresh();
    show("success", "Milestone updated successfully");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditStart("");
    setEditTarget("");
  };

  const onDelete = () => {
    if (!deleteConfirm) return;
    deleteMilestone(deleteConfirm.id);
    setDeleteConfirm(null);
    refresh();
    show("success", "Milestone deleted");
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Flag className="w-4 h-4" /> Milestones
        </h3>
        {!adding ? (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Milestone
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setTitle("");
                setStart("");
                setTarget("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAdd}
              disabled={!title.trim()}
            >
              Save
            </Button>
          </div>
        )}
      </div>

      {adding && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border p-3 rounded-md">
          <div className="space-y-1">
            <label className="text-xs font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design Complete"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Start</label>
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Target</label>
            <Input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No milestones yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const prog = getMilestoneTaskProgress(projectId, m.id);
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="p-3 border rounded-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <>
                        <Input
                          className="text-sm font-medium mb-2"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <div className="flex items-center gap-4 text-xs mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Start:{" "}
                          </span>
                          <Input
                            type="date"
                            className="text-xs"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                          />
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Target:{" "}
                          </span>
                          <Input
                            type="date"
                            className="text-xs"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-medium">{m.title}</div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Start: {m.start || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            Target: {m.target || "—"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {prog.done}/{prog.total} ({prog.percent}%)
                    </div>
                    {isEditing ? (
                      <>
                        <button
                          className="p-1 rounded hover:bg-accent cursor-pointer"
                          onClick={cancelEdit}
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-accent text-primary cursor-pointer"
                          onClick={saveEdit}
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="p-1 rounded hover:bg-accent cursor-pointer"
                          onClick={() => startEdit(m)}
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-accent text-destructive cursor-pointer"
                          onClick={() =>
                            setDeleteConfirm({ id: m.id, title: m.title })
                          }
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-linear-to-r from-primary to-primary/60"
                    style={{ width: `${prog.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        size="sm"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delete Milestone</h3>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteConfirm?.title}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
