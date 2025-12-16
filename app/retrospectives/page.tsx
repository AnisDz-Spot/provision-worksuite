"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  RotateCcw,
  Plus,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Circle,
  TrendingUp,
  AlertCircle,
  Target,
  Clock,
} from "lucide-react";
import { log } from "@/lib/logger";

type RetroItem = {
  id: string;
  text: string;
  votes: number;
};

type ActionItem = {
  id: string;
  text: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
};

type Retrospective = {
  id: string;
  title: string;
  projectId: string | null;
  sprintNumber: number | null;
  date: string;
  attendees: string[];
  wentWell: RetroItem[];
  needsImprovement: RetroItem[];
  actionItems: ActionItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export default function RetrospectivesPage() {
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [selectedRetro, setSelectedRetro] = useState<Retrospective | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    projectId: null as string | null,
    sprintNumber: null as number | null,
    date: new Date().toISOString().split("T")[0],
    attendees: [] as string[],
  });

  useEffect(() => {
    loadRetrospectives();
  }, []);

  const loadRetrospectives = async () => {
    try {
      const res = await fetch("/data/retrospectives.json");
      const data = await res.json();
      setRetrospectives(data);
    } catch (error) {
      log.error({ err: error }, "Failed to load retrospectives");
    }
  };

  const handleCreateNew = () => {
    setFormData({
      title: "",
      projectId: null,
      sprintNumber: null,
      date: new Date().toISOString().split("T")[0],
      attendees: [],
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (isEditing && selectedRetro) {
      setRetrospectives(
        retrospectives.map((r) =>
          r.id === selectedRetro.id
            ? {
                ...r,
                ...formData,
                date: new Date(formData.date).toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );
    } else {
      const newRetro: Retrospective = {
        id: `retro-${Date.now()}`,
        ...formData,
        date: new Date(formData.date).toISOString(),
        wentWell: [],
        needsImprovement: [],
        actionItems: [],
        createdBy: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRetrospectives([newRetro, ...retrospectives]);
    }
    setIsModalOpen(false);
  };

  const toggleActionItem = (retroId: string, actionId: string) => {
    setRetrospectives(
      retrospectives.map((r) =>
        r.id === retroId
          ? {
              ...r,
              actionItems: r.actionItems.map((a) =>
                a.id === actionId ? { ...a, completed: !a.completed } : a
              ),
            }
          : r
      )
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <section className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Retrospectives</h1>
            <p className="text-sm text-muted-foreground">
              Reflect on what went well and what needs improvement
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Retrospective
        </Button>
      </div>

      <div className="grid gap-6">
        {retrospectives.map((retro) => {
          const completedActions = retro.actionItems.filter(
            (a) => a.completed
          ).length;
          const totalActions = retro.actionItems.length;
          const completionRate =
            totalActions > 0
              ? Math.round((completedActions / totalActions) * 100)
              : 0;

          return (
            <Card key={retro.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{retro.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(retro.date)}</span>
                    </div>
                    {retro.sprintNumber && (
                      <Badge variant="secondary">
                        Sprint {retro.sprintNumber}
                      </Badge>
                    )}
                    {retro.projectId && (
                      <Badge variant="secondary">
                        Project: {retro.projectId}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Went Well */}
                <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      What Went Well
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {retro.wentWell.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No items added yet
                      </p>
                    ) : (
                      retro.wentWell.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-2 bg-background/50 rounded"
                        >
                          <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">{item.text}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                👍 {item.votes}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Needs Improvement */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                      Needs Improvement
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {retro.needsImprovement.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No items added yet
                      </p>
                    ) : (
                      retro.needsImprovement.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 p-2 bg-background/50 rounded"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm">{item.text}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                👍 {item.votes}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Items */}
              {retro.actionItems.length > 0 && (
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        Action Items ({completedActions}/{totalActions})
                      </h4>
                    </div>
                    {totalActions > 0 && (
                      <Badge variant="secondary">
                        {completionRate}% complete
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {retro.actionItems.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-3 p-2 bg-background/50 rounded hover:bg-accent/50 transition-colors"
                      >
                        <button
                          onClick={() => toggleActionItem(retro.id, action.id)}
                          className="mt-0.5 cursor-pointer"
                        >
                          {action.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              action.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {action.text}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Assigned: {action.assignedTo}</span>
                            <span>
                              Due:{" "}
                              {new Date(action.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Retrospective" : "New Retrospective"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Sprint 23 Retrospective"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sprint Number (optional)
              </label>
              <Input
                type="number"
                value={formData.sprintNumber || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sprintNumber: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="23"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Attendees (comma-separated)
            </label>
            <Input
              value={formData.attendees.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  attendees: e.target.value
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
                })
              }
              placeholder="user-1, user-2, user-3"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Save Changes" : "Create Retrospective"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
