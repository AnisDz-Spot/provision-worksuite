"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  AlertTriangle,
  Plus,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  X,
} from "lucide-react";

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RiskStatus =
  | "identified"
  | "mitigating"
  | "monitoring"
  | "resolved";

export type Risk = {
  id: string;
  title: string;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5; // 1=Very Low, 5=Very High
  impact: 1 | 2 | 3 | 4 | 5; // 1=Very Low, 5=Very High
  level: RiskLevel;
  status: RiskStatus;
  owner: string;
  mitigation?: string;
  identifiedDate: string;
  lastUpdated: string;
};

interface RiskMatrixProps {
  projectId: string;
  projectName: string;
}

export function RiskMatrix({ projectId, projectName }: RiskMatrixProps) {
  const [risks, setRisks] = useState<Risk[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(`pv:risks:${projectId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    probability: 3,
    impact: 3,
    owner: "",
    mitigation: "",
    status: "identified" as RiskStatus,
  });

  const calculateRiskLevel = (
    probability: number,
    impact: number
  ): RiskLevel => {
    const score = probability * impact;
    if (score >= 20) return "critical";
    if (score >= 12) return "high";
    if (score >= 6) return "medium";
    return "low";
  };

  const saveRisks = (newRisks: Risk[]) => {
    setRisks(newRisks);
    localStorage.setItem(`pv:risks:${projectId}`, JSON.stringify(newRisks));
  };

  const addOrUpdateRisk = () => {
    if (!formData.title.trim()) return;

    const level = calculateRiskLevel(formData.probability, formData.impact);
    const now = new Date().toISOString();

    if (editingRisk) {
      const updated = risks.map((r) =>
        r.id === editingRisk.id
          ? {
              ...r,
              ...formData,
              probability: formData.probability as 1 | 2 | 3 | 4 | 5,
              impact: formData.impact as 1 | 2 | 3 | 4 | 5,
              level,
              lastUpdated: now,
            }
          : r
      );
      saveRisks(updated);
    } else {
      const newRisk: Risk = {
        id: `risk_${Date.now()}`,
        ...formData,
        level,
        probability: formData.probability as 1 | 2 | 3 | 4 | 5,
        impact: formData.impact as 1 | 2 | 3 | 4 | 5,
        identifiedDate: now,
        lastUpdated: now,
      };
      saveRisks([...risks, newRisk]);
    }

    resetForm();
    setModalOpen(false);
  };

  const deleteRisk = (id: string) => {
    saveRisks(risks.filter((r) => r.id !== id));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      probability: 3,
      impact: 3,
      owner: "",
      mitigation: "",
      status: "identified",
    });
    setEditingRisk(null);
  };

  const openEditModal = (risk: Risk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      probability: risk.probability,
      impact: risk.impact,
      owner: risk.owner,
      mitigation: risk.mitigation || "",
      status: risk.status,
    });
    setModalOpen(true);
  };

  const getLevelColor = (level: RiskLevel) => {
    switch (level) {
      case "critical":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "low":
        return "bg-green-500/10 text-green-700 border-green-500/20";
    }
  };

  const getStatusIcon = (status: RiskStatus) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "mitigating":
        return <TrendingDown className="w-4 h-4 text-blue-600" />;
      case "monitoring":
        return <TrendingUp className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    }
  };

  const risksByLevel = {
    critical: risks.filter(
      (r) => r.level === "critical" && r.status !== "resolved"
    ),
    high: risks.filter((r) => r.level === "high" && r.status !== "resolved"),
    medium: risks.filter(
      (r) => r.level === "medium" && r.status !== "resolved"
    ),
    low: risks.filter((r) => r.level === "low" && r.status !== "resolved"),
  };

  const totalActive = Object.values(risksByLevel).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h2 className="text-xl font-bold">Risk Management</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Identify and track project risks - {totalActive} active risks
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Risk
          </Button>
        </div>

        {/* Risk Matrix Grid */}
        <div className="mb-6 overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">
              PROBABILITY →
            </div>
            <div className="grid grid-cols-6 gap-2">
              <div className="flex items-center justify-center text-xs font-semibold text-muted-foreground">
                <div className="transform -rotate-90 whitespace-nowrap">
                  IMPACT ↓
                </div>
              </div>
              {[1, 2, 3, 4, 5].map((prob) => (
                <div
                  key={prob}
                  className="text-center text-xs font-semibold text-muted-foreground py-1"
                >
                  {prob}
                </div>
              ))}

              {[5, 4, 3, 2, 1].map((impact) => (
                <React.Fragment key={impact}>
                  <div className="flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    {impact}
                  </div>
                  {[1, 2, 3, 4, 5].map((prob) => {
                    const level = calculateRiskLevel(prob, impact);
                    const cellRisks = risks.filter(
                      (r) =>
                        r.probability === prob &&
                        r.impact === impact &&
                        r.status !== "resolved"
                    );
                    return (
                      <div
                        key={`${prob}-${impact}`}
                        className={`p-2 rounded border-2 min-h-16 ${getLevelColor(level)} transition-all hover:scale-105 cursor-pointer`}
                        title={`${level.toUpperCase()}: Probability ${prob}, Impact ${impact}`}
                      >
                        {cellRisks.length > 0 && (
                          <div className="text-center">
                            <div className="font-bold text-lg">
                              {cellRisks.length}
                            </div>
                            <div className="text-xs opacity-70">
                              risk{cellRisks.length > 1 ? "s" : ""}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          {(["critical", "high", "medium", "low"] as const).map((level) => (
            <Card
              key={level}
              className={`p-4 border-2 ${getLevelColor(level)}`}
            >
              <div className="font-semibold text-sm capitalize mb-1">
                {level} Risk
              </div>
              <div className="text-2xl font-bold">
                {risksByLevel[level].length}
              </div>
            </Card>
          ))}
        </div>

        {/* Risk List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Active Risks</h3>
          {risks.filter((r) => r.status !== "resolved").length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active risks identified</p>
            </div>
          ) : (
            risks
              .filter((r) => r.status !== "resolved")
              .sort(
                (a, b) => b.probability * b.impact - a.probability * a.impact
              )
              .map((risk) => (
                <Card
                  key={risk.id}
                  className={`p-4 border-l-4 ${getLevelColor(risk.level)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(risk.status)}
                        <h4 className="font-semibold">{risk.title}</h4>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {risk.level}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {risk.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {risk.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Probability: <strong>{risk.probability}/5</strong>
                        </span>
                        <span>
                          Impact: <strong>{risk.impact}/5</strong>
                        </span>
                        <span>
                          Owner: <strong>{risk.owner}</strong>
                        </span>
                      </div>
                      {risk.mitigation && (
                        <div className="mt-2 p-2 bg-accent/20 rounded text-xs">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(risk)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteRisk(risk.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </div>
      </Card>

      {/* Add/Edit Risk Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen} size="lg">
        <div className="space-y-4">
          <h3 className="text-xl font-bold">
            {editingRisk ? "Edit Risk" : "Add New Risk"}
          </h3>

          <div>
            <label className="block text-sm font-medium mb-2">Risk Title</label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Technical debt accumulation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the risk..."
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-20"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Probability (1-5)
              </label>
              <select
                value={formData.probability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    probability: Number(e.target.value),
                  })
                }
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              >
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Impact (1-5)
              </label>
              <select
                value={formData.impact}
                onChange={(e) =>
                  setFormData({ ...formData, impact: Number(e.target.value) })
                }
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              >
                <option value={1}>1 - Very Low</option>
                <option value={2}>2 - Low</option>
                <option value={3}>3 - Medium</option>
                <option value={4}>4 - High</option>
                <option value={5}>5 - Very High</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Risk Owner
              </label>
              <Input
                value={formData.owner}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                placeholder="Who is responsible?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as RiskStatus,
                  })
                }
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              >
                <option value="identified">Identified</option>
                <option value="monitoring">Monitoring</option>
                <option value="mitigating">Mitigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mitigation Strategy (Optional)
            </label>
            <textarea
              value={formData.mitigation}
              onChange={(e) =>
                setFormData({ ...formData, mitigation: e.target.value })
              }
              placeholder="How will you mitigate this risk?"
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-16"
            />
          </div>

          <div className="p-4 rounded-lg bg-accent/20">
            <div className="text-sm font-medium mb-1">
              Calculated Risk Level
            </div>
            <Badge
              variant="secondary"
              className={`text-sm capitalize ${getLevelColor(
                calculateRiskLevel(formData.probability, formData.impact)
              )}`}
            >
              {calculateRiskLevel(formData.probability, formData.impact)}
            </Badge>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={addOrUpdateRisk}>
              {editingRisk ? "Update Risk" : "Add Risk"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
