"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  MessageSquare,
  User,
  Calendar,
  TrendingUp,
  XCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";
import {
  CATEGORY_OPTIONS,
  getCategoryConfig,
  BlockerCategory,
  loadCategoryConfigs,
  CategoryConfig,
} from "@/lib/blockers";
import {
  DEFAULT_RISK_LEVELS,
  loadRiskLevels,
  RiskLevelConfig,
} from "@/lib/risks";

import { useDataMode } from "@/lib/hooks/useDataMode";

type RiskLevel = "critical" | "high" | "medium" | "low" | string;
type BlockerStatus = "open" | "in-progress" | "resolved" | "deferred";

type Blocker = {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  status: BlockerStatus;
  impactedTasks: string[];
  assignedTo?: string;
  reportedBy: string;
  reportedDate: string;
  resolvedDate?: string;
  resolution?: string;
  category: "technical" | "resource" | "dependency" | "external" | "decision";
};

type RiskBlockerDashboardProps = {
  projectId?: string | number;
};

// Mock data - in production, load from API/localStorage
const BLOCKERS: Blocker[] = [
  {
    id: "b1",
    title: "Database Migration Failure",
    description:
      "Critical failure during Prisma migration in staging environment. Production deployment on hold.",
    level: "critical",
    status: "open",
    impactedTasks: ["Environment Setup", "DB Deployment"],
    assignedTo: "Anis Dzed",
    reportedBy: "System",
    reportedDate: "2025-12-25",
    category: "technical",
  },
  {
    id: "b2",
    title: "AWS S3 Rate Limiting",
    description:
      "Storage provider is hitting rate limits for avatar uploads. Need to implement local fallback.",
    level: "high",
    status: "in-progress",
    impactedTasks: ["Profile Settings", "Avatar Upload"],
    assignedTo: "Bob Smith",
    reportedBy: "Carol Davis",
    reportedDate: "2025-12-26",
    category: "external",
  },
];

export function RiskBlockerDashboard({ projectId }: RiskBlockerDashboardProps) {
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const { isMock } = useDataMode();
  const [filter, setFilter] = useState<{
    level?: RiskLevel;
    status?: BlockerStatus;
    category?: string;
  }>({});
  const [selectedBlocker, setSelectedBlocker] = useState<Blocker | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newBlocker, setNewBlocker] = useState({
    title: "",
    description: "",
    level: "medium" as RiskLevel,
    category: "technical" as Blocker["category"],
  });
  const [runtimeCategories, setRuntimeCategories] =
    useState<CategoryConfig[]>(CATEGORY_OPTIONS);
  const [riskLevels, setRiskLevels] =
    useState<RiskLevelConfig[]>(DEFAULT_RISK_LEVELS);
  const [graphExpanded, setGraphExpanded] = useState(false);

  React.useEffect(() => {
    loadCategoryConfigs().then(setRuntimeCategories);
    loadRiskLevels().then(setRiskLevels);

    if (isMock) {
      setBlockers(BLOCKERS);
    } else {
      loadBlockersFromDB();
    }
  }, [isMock, projectId]);

  const loadBlockersFromDB = async () => {
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (!shouldUseDatabaseData()) return;

      const res = await fetch(
        `/api/blockers${projectId ? `?projectId=${String(projectId)}` : ""}`,
      );
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const dbBlockers: Blocker[] = json.data.map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          level: b.level as RiskLevel,
          status: b.status as BlockerStatus,
          impactedTasks: Array.isArray(b.impacted_tasks)
            ? b.impacted_tasks
            : JSON.parse(b.impacted_tasks || "[]"),
          assignedTo: b.assigned_to,
          reportedBy: b.reported_by,
          reportedDate: b.reported_date,
          resolvedDate: b.resolved_date,
          resolution: b.resolution,
          category: b.category,
        }));
        // In live mode, do NOT fallback to mock data if empty
        setBlockers(dbBlockers);
      }
    } catch (e) {
      console.error("Failed to load blockers from DB:", e);
    }
  };

  const filteredBlockers = useMemo(() => {
    return blockers.filter((b) => {
      if (filter.level && b.level !== filter.level) return false;
      if (filter.status && b.status !== filter.status) return false;
      if (filter.category && b.category !== filter.category) return false;
      return true;
    });
  }, [blockers, filter]);

  const stats = useMemo(() => {
    const open = blockers.filter((b) => b.status === "open").length;
    const inProgress = blockers.filter(
      (b) => b.status === "in-progress",
    ).length;
    const critical = blockers.filter(
      (b) => b.level === "critical" && b.status !== "resolved",
    ).length;
    const resolved = blockers.filter((b) => b.status === "resolved").length;

    // Calculate average resolution time dynamically
    let totalDays = 0;
    let resolvedCount = 0;

    blockers.forEach((b) => {
      if (b.status === "resolved" && b.resolvedDate && b.reportedDate) {
        const start = new Date(b.reportedDate).getTime();
        const end = new Date(b.resolvedDate).getTime();
        const diff = end - start;
        const days = diff / (1000 * 60 * 60 * 24);
        if (days >= 0) {
          totalDays += days;
          resolvedCount++;
        }
      }
    });

    const avgResolutionTime =
      resolvedCount > 0
        ? parseFloat((totalDays / resolvedCount).toFixed(1))
        : 0;

    return { open, inProgress, critical, resolved, avgResolutionTime };
  }, [blockers]);

  const getLevelColor = (level: RiskLevel) => {
    const found = riskLevels.find((l) => l.id === level) || riskLevels[0];
    return found.colorClasses;
  };

  const getStatusColor = (status: BlockerStatus) => {
    switch (status) {
      case "open":
        return "text-red-600 bg-red-500/10";
      case "in-progress":
        return "text-amber-600 bg-amber-500/10";
      case "resolved":
        return "text-green-600 bg-green-500/10";
      case "deferred":
        return "text-gray-600 bg-gray-500/10";
    }
  };

  const getCategoryEmoji = (category: Blocker["category"]) => {
    const found =
      runtimeCategories.find((c) => c.id === category) ||
      getCategoryConfig(category as BlockerCategory);
    return found.iconName || "⚠️";
  };

  const handleAddBlocker = async () => {
    if (!newBlocker.title || !newBlocker.description) return;

    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        if (selectedBlocker) {
          // Update existing blocker
          await fetchWithCsrf(`/api/blockers/${selectedBlocker.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newBlocker.title,
              description: newBlocker.description,
              level: newBlocker.level,
              category: newBlocker.category,
            }),
          });
        } else {
          // Create new blocker
          await fetchWithCsrf("/api/blockers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newBlocker.title,
              description: newBlocker.description,
              level: newBlocker.level,
              status: "open",
              impacted_tasks: [],
              reported_by: "Current User",
              reported_date: new Date().toISOString().slice(0, 10),
              category: newBlocker.category,
              project_id: projectId,
            }),
          });
        }
        await loadBlockersFromDB();
      } else {
        if (selectedBlocker) {
          // Update existing blocker in local state
          setBlockers(
            blockers.map((b) =>
              b.id === selectedBlocker.id
                ? {
                    ...b,
                    title: newBlocker.title,
                    description: newBlocker.description,
                    level: newBlocker.level,
                    category: newBlocker.category,
                  }
                : b,
            ),
          );
        } else {
          // Create new blocker in local state
          const blocker: Blocker = {
            id: `b${Date.now()}`,
            ...newBlocker,
            status: "open",
            impactedTasks: [],
            reportedBy: "Current User",
            reportedDate: new Date().toISOString().slice(0, 10),
          };
          setBlockers([blocker, ...blockers]);
        }
      }
    } catch (e) {
      console.error("Failed to save blocker:", e);
    }

    setNewBlocker({
      title: "",
      description: "",
      level: "medium",
      category: "technical",
    });
    setSelectedBlocker(null);
    setModalOpen(false);
  };

  const handleStatusChange = async (
    blockerId: string,
    newStatus: BlockerStatus,
  ) => {
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        await fetchWithCsrf(`/api/blockers/${blockerId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            resolved_date:
              newStatus === "resolved"
                ? new Date().toISOString().slice(0, 10)
                : undefined,
          }),
        });
        await loadBlockersFromDB();
      } else {
        setBlockers(
          blockers.map((b) =>
            b.id === blockerId
              ? {
                  ...b,
                  status: newStatus,
                  resolvedDate:
                    newStatus === "resolved"
                      ? new Date().toISOString().slice(0, 10)
                      : b.resolvedDate,
                }
              : b,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to update blocker:", e);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Risk & Blocker Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Track and resolve project blockers
            </p>
          </div>
        </div>
        {!isMock && (
          <Button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-1" />
            Report Blocker
          </Button>
        )}
      </div>

      {/* Critical Alert */}
      {stats.critical > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-red-700 dark:text-red-400">
              Critical Blockers Active
            </div>
            <div className="text-sm text-red-600 dark:text-red-300">
              {stats.critical} critical blocker{stats.critical > 1 ? "s" : ""}{" "}
              requiring immediate attention
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Open</div>
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">In Progress</div>
          <div className="text-2xl font-bold text-amber-600">
            {stats.inProgress}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-600">
            {stats.critical}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Resolved</div>
          <div className="text-2xl font-bold text-green-600">
            {stats.resolved}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">
            Avg Resolution
          </div>
          <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={!filter.level ? "primary" : "outline"}
          size="sm"
          onClick={() => setFilter({ ...filter, level: undefined })}
        >
          All Levels
        </Button>
        {riskLevels
          .sort((a, b) => a.order - b.order)
          .map((rl) => (
            <Button
              key={rl.id}
              variant={filter.level === rl.id ? "primary" : "outline"}
              size="sm"
              onClick={() =>
                setFilter({ ...filter, level: rl.id as RiskLevel })
              }
            >
              {rl.label}
            </Button>
          ))}
        <div className="w-px h-6 bg-border my-auto mx-1" />
        {(
          ["open", "in-progress", "resolved", "deferred"] as BlockerStatus[]
        ).map((status) => (
          <Button
            key={status}
            variant={filter.status === status ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter({ ...filter, status })}
          >
            {status
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </Button>
        ))}
        {(filter.level || filter.status || filter.category) && (
          <>
            <div className="w-px h-6 bg-border my-auto mx-1" />
            <Button variant="ghost" size="sm" onClick={() => setFilter({})}>
              <XCircle className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          </>
        )}
      </div>

      {/* Blockers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredBlockers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No blockers match the selected filters</p>
          </div>
        ) : (
          filteredBlockers.map((blocker) => (
            <div
              key={blocker.id}
              className={`border rounded-lg p-4 transition-all ${isMock ? "cursor-default" : "hover:shadow-md cursor-pointer"}`}
              onClick={() => {
                if (isMock) return;
                setSelectedBlocker(blocker);
                setNewBlocker({
                  title: blocker.title,
                  description: blocker.description,
                  level: blocker.level,
                  category: blocker.category,
                });
                setModalOpen(true);
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">
                    {getCategoryEmoji(blocker.category)}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{blocker.title}</h4>
                      {blocker.status !== "resolved" && (
                        <div
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getLevelColor(blocker.level)}`}
                        >
                          {blocker.level.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {blocker.description}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(blocker.status)}`}
                >
                  {blocker.status
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {blocker.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {blocker.assignedTo}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(blocker.reportedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {blocker.impactedTasks.length} tasks impacted
                </div>
              </div>

              {blocker.impactedTasks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {blocker.impactedTasks.slice(0, 3).map((task, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {task}
                    </Badge>
                  ))}
                  {blocker.impactedTasks.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{blocker.impactedTasks.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {!isMock && blocker.status !== "resolved" && (
                <div className="mt-3 flex gap-2">
                  {blocker.status === "open" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(blocker.id, "in-progress");
                      }}
                    >
                      Start Work
                    </Button>
                  )}
                  {blocker.status === "in-progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(blocker.id, "resolved");
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Dependency Graph Visualization */}
      {filteredBlockers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Dependency Graph</h4>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGraphExpanded(!graphExpanded)}
            >
              {graphExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
          <div
            className={`border rounded-lg p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-accent ${
              graphExpanded ? "max-h-[600px] overflow-y-auto" : "max-h-[220px]"
            }`}
          >
            <div className="min-w-[550px]">
              <svg
                width="100%"
                height={
                  graphExpanded
                    ? filteredBlockers.reduce((total, b, i) => {
                        const taskCount = Math.min(b.impactedTasks.length, 3);
                        const lastTaskY =
                          20 + (i * 3 + taskCount - 1) * 30 + 28;
                        return Math.max(total, lastTaskY);
                      }, 220) + 40
                    : 220
                }
                className="min-h-[220px]"
              >
                {/* simple horizontal flow layout: blockers on left, tasks on right */}
                {filteredBlockers
                  .slice(0, graphExpanded ? filteredBlockers.length : 5)
                  .map((b, i) => {
                    const y = 20 + i * 40;
                    return (
                      <g key={b.id}>
                        {/* blocker node */}
                        <rect
                          x={10}
                          y={y}
                          width={160}
                          height={28}
                          rx={6}
                          className="fill-red-500/10 stroke-red-500/30"
                        />
                        <text
                          x={20}
                          y={y + 18}
                          className="text-xs fill-red-700"
                        >
                          {b.title.slice(0, 22)}
                          {b.title.length > 22 ? "…" : ""}
                        </text>
                        {/* edges to tasks */}
                        {b.impactedTasks.slice(0, 3).map((t, ti) => {
                          const ty = 20 + (i * 3 + ti) * 30;
                          const tx = 340;
                          return (
                            <g key={`${b.id}-t-${ti}`}>
                              <line
                                x1={170}
                                y1={y + 14}
                                x2={tx}
                                y2={ty + 14}
                                className="stroke-muted-foreground"
                                strokeOpacity={0.3}
                              />
                              <rect
                                x={tx}
                                y={ty}
                                width={200}
                                height={28}
                                rx={6}
                                className="fill-secondary stroke-border"
                              />
                              <text
                                x={tx + 10}
                                y={ty + 18}
                                className="text-xs fill-muted-foreground"
                              >
                                {t.slice(0, 26)}
                                {t.length > 26 ? "…" : ""}
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Add Blocker Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedBlocker(null);
            setNewBlocker({
              title: "",
              description: "",
              level: "medium" as RiskLevel,
              category: "technical" as Blocker["category"],
            });
          }
        }}
        size="xl"
        className="md:min-w-[40vw]"
      >
        <h3 className="text-lg font-semibold mb-4">
          {selectedBlocker ? "Edit Blocker" : "Report New Blocker"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <Input
              value={newBlocker.title}
              onChange={(e) =>
                setNewBlocker({ ...newBlocker, title: e.target.value })
              }
              placeholder="Brief description of the blocker"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm min-h-[100px]"
              value={newBlocker.description}
              onChange={(e) =>
                setNewBlocker({ ...newBlocker, description: e.target.value })
              }
              placeholder="Detailed explanation of the issue and its impact"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Risk Level
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                value={newBlocker.level}
                onChange={(e) =>
                  setNewBlocker({
                    ...newBlocker,
                    level: e.target.value as RiskLevel,
                  })
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                value={newBlocker.category}
                onChange={(e) =>
                  setNewBlocker({
                    ...newBlocker,
                    category: e.target.value as Blocker["category"],
                  })
                }
              >
                {runtimeCategories.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.iconName} {opt.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                {(() => {
                  const cfg =
                    runtimeCategories.find(
                      (c) => c.id === (newBlocker.category as BlockerCategory),
                    ) ||
                    getCategoryConfig(newBlocker.category as BlockerCategory);
                  return `Target SLA: ${cfg.slaDays} days • Owner: ${cfg.defaultOwnerGroup}`;
                })()}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleAddBlocker} className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              {selectedBlocker ? "Update Blocker" : "Create Blocker"}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
