"use client";
import { useState, useEffect } from "react";
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
  });

  useEffect(() => {
    loadDecisions();
  }, []);

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

  const loadDecisions = async () => {
    try {
      const res = await fetch("/data/decisions.json");
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
    });
    setSelectedDecision(decision);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = () => {
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

      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? "Edit Decision" : "New Decision"}
        </h2>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Adopt TypeScript for New Projects"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "approved" | "pending" | "rejected",
                })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg cursor-pointer"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Context</label>
            <textarea
              value={formData.context}
              onChange={(e) =>
                setFormData({ ...formData, context: e.target.value })
              }
              placeholder="Describe the situation that led to this decision..."
              className="w-full min-h-20 px-3 py-2 bg-background border border-border rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Decision</label>
            <textarea
              value={formData.decision}
              onChange={(e) =>
                setFormData({ ...formData, decision: e.target.value })
              }
              placeholder="What was decided?"
              className="w-full min-h-20 px-3 py-2 bg-background border border-border rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rationale</label>
            <textarea
              value={formData.rationale}
              onChange={(e) =>
                setFormData({ ...formData, rationale: e.target.value })
              }
              placeholder="Why was this decision made?"
              className="w-full min-h-20 px-3 py-2 bg-background border border-border rounded-lg resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Alternatives (comma-separated)
            </label>
            <Input
              value={formData.alternatives.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  alternatives: e.target.value
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Option A, Option B, Option C"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Consequences (comma-separated)
            </label>
            <Input
              value={formData.consequences.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  consequences: e.target.value
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Impact 1, Impact 2, Impact 3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
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
          <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-background">
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
