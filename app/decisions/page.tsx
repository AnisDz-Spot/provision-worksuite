"use client";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { log } from "@/lib/logger";
import { AttendeeSelector } from "@/components/workflow/AttendeeSelector";
import Image from "next/image";

type Decision = {
  id: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  alternatives: string[];
  consequences: string[];
  projectId: string | null;
  decidedBy: string[];
  decidedAt: string;
  status: "approved" | "pending" | "rejected";
  tags: string[];
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [filteredDecisions, setFilteredDecisions] = useState<Decision[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    context: "",
    decision: "",
    rationale: "",
    alternatives: [] as string[],
    consequences: [] as string[],
    projectId: null as string | null,
    status: "pending" as "approved" | "pending" | "rejected",
    tags: [] as string[],
    decidedBy: [] as string[],
  });

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadDecisions();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      if (isRealMode()) {
        const res = await fetch("/api/users");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setUsers(json.data);
      } else {
        const res = await fetch("/data/users.json");
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      log.error({ err }, "Failed to load users");
    }
  };

  useEffect(() => {
    let filtered = decisions;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((d) => d.status === filterStatus);
    }

    setFilteredDecisions(filtered);
  }, [searchQuery, filterStatus, decisions]);

  const isRealMode = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pv:dataMode") === "real";
  };

  const loadDecisions = async () => {
    try {
      const endpoint = isRealMode() ? "/api/decisions" : "/data/decisions.json";
      const res = await fetch(endpoint);
      const data = await res.json();
      setDecisions(data);
      setFilteredDecisions(data);
    } catch (error) {
      log.error({ err: error }, "Failed to load decisions");
    }
  };

  const handleCreateNew = () => {
    setFormData({
      title: "",
      context: "",
      decision: "",
      rationale: "",
      alternatives: [],
      consequences: [],
      projectId: null,
      status: "pending",
      tags: [],
      decidedBy: [],
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (decision: Decision) => {
    setFormData({
      title: decision.title,
      context: decision.context,
      decision: decision.decision,
      rationale: decision.rationale,
      alternatives: decision.alternatives,
      consequences: decision.consequences,
      projectId: decision.projectId,
      status: decision.status,
      tags: decision.tags,
      decidedBy: decision.decidedBy || [],
    });
    setSelectedDecision(decision);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (isRealMode()) {
      try {
        const payload = {
          id: isEditing && selectedDecision ? selectedDecision.id : undefined,
          ...formData,
        };

        const res = await fetch("/api/decisions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const saved = await res.json();

        if (saved.id) {
          loadDecisions();
          setIsModalOpen(false);
        }
      } catch (err) {
        log.error({ err }, "Failed to save decision");
      }
      return;
    }

    // Mock Mode
    if (isEditing && selectedDecision) {
      setDecisions(
        decisions.map((d) =>
          d.id === selectedDecision.id ? { ...d, ...formData } : d
        )
      );
    } else {
      const newDecision: Decision = {
        id: `decision-${Date.now()}`,
        ...formData,
        decidedBy: ["user-1"],
        decidedAt: new Date().toISOString(),
      };
      setDecisions([newDecision, ...decisions]);
    }
    setIsModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-500/10";
      case "pending":
        return "text-yellow-600 bg-yellow-500/10";
      case "rejected":
        return "text-red-600 bg-red-500/10";
      default:
        return "text-gray-600 bg-gray-500/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <section className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Decision Log</h1>
            <p className="text-sm text-muted-foreground">
              Track important project decisions and their context
            </p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          New Decision
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <Input
            type="search"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "approved" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("approved")}
            >
              Approved
            </Button>
            <Button
              variant={filterStatus === "pending" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("pending")}
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === "rejected" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("rejected")}
            >
              Rejected
            </Button>
          </div>
        </div>
      </Card>

      {filteredDecisions.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <div className="p-4 rounded-full bg-muted inline-flex mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No decisions found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery || filterStatus !== "all"
              ? "Try adjusting your search or filters."
              : "Start tracking important project decisions, context, and outcomes."}
          </p>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            New Decision
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDecisions.map((decision) => (
            <Card
              key={decision.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{decision.title}</h3>
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(decision.status)}`}
                    >
                      {getStatusIcon(decision.status)}
                      <span className="capitalize">{decision.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(decision.decidedAt)}</span>
                    </div>
                    {decision.projectId && (
                      <Badge variant="secondary">
                        Project: {decision.projectId}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(decision)}
                >
                  Edit
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Context</h4>
                  <p className="text-sm text-muted-foreground">
                    {decision.context}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Decision</h4>
                  <p className="text-sm">{decision.decision}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Rationale</h4>
                  <p className="text-sm text-muted-foreground">
                    {decision.rationale}
                  </p>
                </div>
                {decision.alternatives.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">
                      Alternatives Considered
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {decision.alternatives.map((alt, idx) => (
                        <li key={idx}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {decision.consequences.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Consequences</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {decision.consequences.map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {decision.tags.length > 0 && (
                  <div className="flex gap-2 pt-2">
                    {decision.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen} size="xl">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Decision" : "New Decision"}
        </h2>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Adopt TypeScript"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Project ID (Optional)
              </label>
              <Input
                value={formData.projectId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectId: e.target.value || null,
                  })
                }
                placeholder="e.g. PROJ-123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as
                      | "approved"
                      | "pending"
                      | "rejected",
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg cursor-pointer text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Context</label>
            <textarea
              value={formData.context}
              onChange={(e) =>
                setFormData({ ...formData, context: e.target.value })
              }
              placeholder="Describe the situation..."
              className="w-full min-h-[80px] px-3 py-2 bg-background border border-border rounded-lg resize-y text-sm"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Decision</label>
              <textarea
                value={formData.decision}
                onChange={(e) =>
                  setFormData({ ...formData, decision: e.target.value })
                }
                placeholder="What was decided?"
                className="w-full min-h-[100px] px-3 py-2 bg-background border border-border rounded-lg resize-y text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Rationale
              </label>
              <textarea
                value={formData.rationale}
                onChange={(e) =>
                  setFormData({ ...formData, rationale: e.target.value })
                }
                placeholder="Why was this chosen?"
                className="w-full min-h-[100px] px-3 py-2 bg-background border border-border rounded-lg resize-y text-sm"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg">
            {/* Alternatives */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Alternatives Considered
              </label>
              <div className="space-y-2 mb-2">
                {formData.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 items-center bg-background p-2 rounded border"
                  >
                    <span className="text-sm flex-1">{alt}</span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          alternatives: prev.alternatives.filter(
                            (_, i) => i !== idx
                          ),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <span className="sr-only">Remove</span>×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add alternative..."
                  id="alt-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        setFormData((prev) => ({
                          ...prev,
                          alternatives: [...prev.alternatives, val],
                        }));
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const el = document.getElementById(
                      "alt-input"
                    ) as HTMLInputElement;
                    if (el?.value.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        alternatives: [...prev.alternatives, el.value.trim()],
                      }));
                      el.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Consequences */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Consequences
              </label>
              <div className="space-y-2 mb-2">
                {formData.consequences.map((con, idx) => (
                  <div
                    key={idx}
                    className="flex gap-2 items-center bg-background p-2 rounded border"
                  >
                    <span className="text-sm flex-1">{con}</span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          consequences: prev.consequences.filter(
                            (_, i) => i !== idx
                          ),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <span className="sr-only">Remove</span>×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add consequence..."
                  id="con-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        setFormData((prev) => ({
                          ...prev,
                          consequences: [...prev.consequences, val],
                        }));
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const el = document.getElementById(
                      "con-input"
                    ) as HTMLInputElement;
                    if (el?.value.trim()) {
                      setFormData((prev) => ({
                        ...prev,
                        consequences: [...prev.consequences, el.value.trim()],
                      }));
                      el.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Decided By</label>
            <AttendeeSelector
              selectedAttendees={formData.decidedBy}
              onChange={(attendees) =>
                setFormData({ ...formData, decidedBy: attendees })
              }
              teamMembers={users.map((u) => ({ ...u, id: u.uid }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <Input
              value={formData.tags.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
              placeholder="technical, standards, process"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background/95 backdrop-blur p-2 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? "Save Changes" : "Create Decision"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
