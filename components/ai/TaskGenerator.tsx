"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Brain,
  Loader2,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { upsertTask } from "@/lib/utils/tasks";
import { useToaster } from "@/components/ui/Toaster";

interface GeneratedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimateHours: number;
  type: "feature" | "bug" | "task" | "documentation" | "design";
}

/**
 * TaskGenerator Component
 * Provides a button to trigger AI milestone breakdown and a modal to review/approve tasks.
 */
export function TaskGenerator({
  projectId,
  milestoneId,
  milestoneTitle,
  milestoneDescription,
  onComplete,
}: {
  projectId: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDescription?: string;
  onComplete: () => void;
}) {
  const { show } = useToaster();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Calls the AI API to generate a list of suggested tasks
   */
  async function generateTasks() {
    setLoading(true);
    setTasks([]);
    setSelectedIndices([]);
    try {
      const res = await fetch("/api/ai/breakdown-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: milestoneTitle,
          description: milestoneDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        // Default select all
        setSelectedIndices(data.tasks.map((_: any, i: number) => i));
        setIsOpen(true);
      } else {
        show(
          "error",
          data.error || "Failed to generate tasks. Ensure AI is configured."
        );
      }
    } catch (err) {
      show("error", "AI service unavailable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Persists the selected tasks to the project
   */
  async function saveSelectedTasks() {
    try {
      const selectedTasks = tasks.filter((_, i) => selectedIndices.includes(i));
      for (const t of selectedTasks) {
        // Generate a pseudo-unique ID for the task
        const taskId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        await upsertTask({
          id: taskId,
          projectId,
          milestoneId,
          title: t.title,
          description: t.description,
          priority: (t.priority === "urgent" ? "high" : t.priority) as any,
          estimateHours: t.estimateHours,
          status: "todo",
          type: t.type,
          loggedHours: 0,
        });
      }
      show(
        "success",
        `Injected ${selectedTasks.length} agentic tasks into Project!`
      );
      setIsOpen(false);
      onComplete(); // Refresh parent view
    } catch (err) {
      console.error(err);
      show("error", "Failed to save tasks to workspace.");
    }
  }

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={generateTasks}
        disabled={loading}
        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
        ) : (
          <Brain className="w-3.5 h-3.5 mr-1.5" />
        )}
        Auto-Breakdown
      </Button>

      <Modal open={isOpen} onOpenChange={setIsOpen} size="lg">
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/10">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">
                Agentic Task Architect
              </h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                Suggested Breakdown for:{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {milestoneTitle}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto px-1 py-1 custom-scrollbar">
            {tasks.map((task, i) => (
              <div
                key={i}
                onClick={() => toggleSelect(i)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group ${
                  selectedIndices.includes(i)
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                    : "border-border hover:border-indigo-200 dark:hover:border-indigo-800"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedIndices.includes(i)
                        ? "bg-indigo-500 border-indigo-500 scale-110 shadow-md"
                        : "border-muted-foreground/20"
                    }`}
                  >
                    {selectedIndices.includes(i) && (
                      <Check className="w-4 h-4 text-white stroke-[3px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-sm leading-tight text-foreground truncate max-w-[70%]">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="default"
                          className="text-[10px] uppercase font-black px-1.5 h-5 bg-background border-muted-foreground/20"
                        >
                          {task.type}
                        </Badge>
                        <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground/80 bg-muted px-1.5 h-5 rounded-md uppercase tracking-tighter">
                          <Clock className="w-3 h-3" />
                          {task.estimateHours}H
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                      {task.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border/50">
            <div className="flex flex-col">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {selectedIndices.length} items staged
              </p>
              <p className="text-[10px] text-muted-foreground">
                Confirm to append to project task list.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="font-bold"
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveSelectedTasks}
                disabled={selectedIndices.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 px-6 font-bold"
              >
                Inject Selected Tasks
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </>
  );
}
