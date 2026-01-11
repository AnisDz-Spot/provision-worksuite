"use client";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  CalendarDays,
  Flag,
  Trash2,
  Plus,
  Save,
  Edit2,
  X,
  Receipt,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  Milestone,
  getMilestonesByProject,
  upsertMilestone,
  deleteMilestone,
} from "@/lib/utils";
import { useToaster } from "@/components/ui/Toaster";
import { useLoading } from "@/context/LoadingContext";
import { Badge } from "@/components/ui/Badge";
import { TaskGenerator } from "@/components/ai/TaskGenerator";
import { fetchWithCsrf } from "@/lib/csrf-client";

export function ProjectMilestones({ projectId }: { projectId: string }) {
  const { show } = useToaster();
  const [items, setItems] = React.useState<Milestone[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [start, setStart] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editStart, setEditStart] = React.useState("");
  const [editTarget, setEditTarget] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    title: string;
  } | null>(null);
  const { showLoader, hideLoader } = useLoading();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const data = await getMilestonesByProject(projectId);
    setItems(data);
  }, [projectId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const onAdd = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    showLoader("Creating milestone...");
    try {
      const m: Milestone = {
        id: `m_${Date.now()}`,
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        start: start || undefined,
        target: target || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        paymentStatus: "unpaid",
      };
      await upsertMilestone(m);
      window.dispatchEvent(new Event("pv:milestonesUpdated"));
      setTitle("");
      setDescription("");
      setStart("");
      setTarget("");
      setAmount("");
      setAdding(false);
      await refresh();
      show("success", "Milestone created successfully");
    } catch (error) {
      console.error(error);
      show("error", "Failed to create milestone");
    } finally {
      setIsSubmitting(false);
      hideLoader();
    }
  };

  const startEdit = (m: Milestone) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditDescription(m.description || "");
    setEditStart(m.start || "");
    setEditTarget(m.target || "");
    setEditAmount(m.amount ? String(m.amount) : "");
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    setIsSubmitting(true);
    showLoader("Updating milestone...");
    try {
      const m: Milestone = {
        id: editingId,
        projectId,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        start: editStart || undefined,
        target: editTarget || undefined,
        amount: editAmount ? parseFloat(editAmount) : undefined,
        paymentStatus:
          items.find((i) => i.id === editingId)?.paymentStatus || "unpaid",
      };
      await upsertMilestone(m);
      window.dispatchEvent(new Event("pv:milestonesUpdated"));
      setEditingId(null);
      setEditDescription("");
      await refresh();
      show("success", "Milestone updated successfully");
    } catch (error) {
      console.error(error);
      show("error", "Failed to update milestone");
    } finally {
      setIsSubmitting(false);
      hideLoader();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditStart("");
    setEditTarget("");
    setEditAmount("");
  };

  const onDelete = async () => {
    if (!deleteConfirm) return;
    showLoader("Deleting milestone...");
    try {
      await deleteMilestone(deleteConfirm.id);
      window.dispatchEvent(new Event("pv:milestonesUpdated"));
      setDeleteConfirm(null);
      await refresh();
      show("success", "Milestone deleted");
    } catch (error) {
      console.error(error);
      show("error", "Failed to delete milestone");
    } finally {
      hideLoader();
    }
  };

  const handleGenerateInvoice = async (m: Milestone) => {
    if (!m.amount || m.amount <= 0) {
      show("error", "Milestone has no amount to invoice");
      return;
    }
    if (
      confirm(`Generate invoice for milestone "${m.title}" ($${m.amount})?`)
    ) {
      showLoader("Generating Invoice...");
      try {
        const res = await fetchWithCsrf("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: parseInt(projectId) || undefined, // Try to parse if numeric, handle UUID better if needed but API resolves it
            milestoneId: m.id,
            clientName: "Client For " + projectId, // Ideally fetch project client
            dueDate: new Date().toISOString(), // Immediate due or logic
            items: [
              {
                description: `Milestone: ${m.title}`,
                amount: m.amount,
                rate: m.amount,
                quantity: 1,
              },
            ],
            notes: `Generated from milestone ${m.id}`,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        show("success", "Invoice generated!");
      } catch (e) {
        show("error", "Failed to generate invoice");
      } finally {
        hideLoader();
      }
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "partial":
        return <Clock className="w-3 h-3 text-orange-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
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
                setDescription("");
                setStart("");
                setTarget("");
                setAmount("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onAdd}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {adding && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border p-3 rounded-md">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design Complete"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Amount ($)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Target Date</label>
            <Input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of this milestone..."
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No milestones yet.</div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const prog = {
              total: m.totalTasks || 0,
              done: m.completedTasks || 0,
              percent:
                m.totalTasks && m.totalTasks > 0
                  ? Math.round(((m.completedTasks || 0) / m.totalTasks) * 100)
                  : 0,
            };
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className="p-3 border rounded-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Input
                            className="text-sm font-medium"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Start Date"
                          />
                          <Input
                            type="number"
                            className="text-sm"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            placeholder="Amount"
                          />
                        </div>

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
                        <Input
                          className="text-xs mt-2"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description..."
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{m.title}</div>
                          {m.amount && m.amount > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5 px-1 gap-1"
                            >
                              {getStatusIcon(m.paymentStatus)}$
                              {m.amount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
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
                        {m.description && (
                          <div className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                            {m.description}
                          </div>
                        )}
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
                          className="p-1 rounded hover:bg-accent text-primary cursor-pointer disabled:opacity-50"
                          onClick={saveEdit}
                          title="Save"
                          disabled={isSubmitting}
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {m.amount && m.amount > 0 && (
                          <button
                            className="p-1 rounded hover:bg-accent text-blue-500 cursor-pointer"
                            onClick={() => handleGenerateInvoice(m)}
                            title="Generate Invoice"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        )}
                        <TaskGenerator
                          projectId={projectId}
                          milestoneId={m.id}
                          milestoneTitle={m.title}
                          milestoneDescription={m.description}
                          onComplete={refresh}
                        />
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
