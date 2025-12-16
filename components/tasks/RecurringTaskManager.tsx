"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Repeat, Plus, Trash2, Edit2, Calendar, Clock } from "lucide-react";
import {
  createRRule,
  parseRRule,
  describeRecurrence,
  RECURRENCE_PRESETS,
  type RecurrenceFrequency,
} from "@/lib/recurring";
import { useToaster } from "@/components/ui/Toaster";

interface RecurringTemplate {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  priority: string;
  recurrenceRule: string;
  nextRun: string;
  lastRun?: string;
  isActive: boolean;
}

interface Props {
  projectId: string;
  onTaskCreated?: () => void;
}

export function RecurringTaskManager({ projectId, onTaskCreated }: Props) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { show } = useToaster();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    frequency: "WEEKLY" as RecurrenceFrequency,
    interval: 1,
    byDay: ["MO"] as string[],
    byMonthDay: 1,
    endDate: "",
    occurrences: "",
  });

  const DAYS = [
    { value: "MO", label: "Mon" },
    { value: "TU", label: "Tue" },
    { value: "WE", label: "Wed" },
    { value: "TH", label: "Thu" },
    { value: "FR", label: "Fri" },
    { value: "SA", label: "Sat" },
    { value: "SU", label: "Sun" },
  ];

  useEffect(() => {
    loadTemplates();
  }, [projectId]);

  const loadTemplates = async () => {
    try {
      const res = await fetch(`/api/tasks/recurring?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      show("error", "Title is required");
      return;
    }

    // Build RRULE
    const rrule = createRRule({
      frequency: formData.frequency,
      interval: formData.interval,
      byDay: formData.frequency === "WEEKLY" ? formData.byDay : undefined,
      byMonthDay:
        formData.frequency === "MONTHLY" ? formData.byMonthDay : undefined,
      until: formData.endDate ? new Date(formData.endDate) : undefined,
      count: formData.occurrences ? parseInt(formData.occurrences) : undefined,
    });

    try {
      const res = await fetch("/api/tasks/recurring", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: formData.title,
          description: formData.description,
          projectId,
          priority: formData.priority,
          recurrenceRule: rrule,
          endDate: formData.endDate || null,
          occurrences: formData.occurrences || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        show(
          "success",
          editingId ? "Template updated" : "Recurring task created"
        );
        setIsOpen(false);
        resetForm();
        loadTemplates();
        onTaskCreated?.();
      } else {
        show("error", data.error || "Failed to save");
      }
    } catch (error) {
      show("error", "Network error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recurring task template?")) return;

    try {
      const res = await fetch(`/api/tasks/recurring?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        show("success", "Template deleted");
        loadTemplates();
      }
    } catch (error) {
      show("error", "Failed to delete");
    }
  };

  const handleEdit = (template: RecurringTemplate) => {
    const parsed = parseRRule(template.recurrenceRule);
    setFormData({
      title: template.title,
      description: template.description || "",
      priority: template.priority,
      frequency: parsed.frequency,
      interval: parsed.interval,
      byDay: parsed.byDay.length > 0 ? parsed.byDay : ["MO"],
      byMonthDay: parsed.byMonthDay || 1,
      endDate: "",
      occurrences: "",
    });
    setEditingId(template.id);
    setIsOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      frequency: "WEEKLY",
      interval: 1,
      byDay: ["MO"],
      byMonthDay: 1,
      endDate: "",
      occurrences: "",
    });
    setEditingId(null);
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      byDay: prev.byDay.includes(day)
        ? prev.byDay.filter((d) => d !== day)
        : [...prev.byDay, day],
    }));
  };

  if (loading) {
    return <Card className="p-6 animate-pulse h-32" />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Recurring Tasks</h3>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No recurring tasks set up yet
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{template.title}</span>
                  <Badge
                    variant={template.isActive ? "success" : "secondary"}
                    pill
                  >
                    {template.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    {describeRecurrence(template.recurrenceRule)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Next: {new Date(template.nextRun).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit Recurring Task" : "Create Recurring Task"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border bg-background"
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border bg-background resize-none"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: e.target.value as RecurrenceFrequency,
                  })
                }
                className="w-full px-3 py-2 rounded-md border bg-background"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          {formData.frequency === "WEEKLY" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Repeat on
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      formData.byDay.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.frequency === "MONTHLY" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Day of month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={formData.byMonthDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    byMonthDay: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Every N {formData.frequency.toLowerCase().replace("ly", "")}s
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.interval}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    interval: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                End date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? "Update" : "Create"} Recurring Task
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
