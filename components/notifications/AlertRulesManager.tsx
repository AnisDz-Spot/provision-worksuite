"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  Bell,
  Plus,
  Trash2,
  Power,
  Mail,
  MessageSquare,
  AlertTriangle,
  Calendar,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export type AlertRule = {
  id: string;
  name: string;
  type:
    | "overdue_tasks"
    | "deadline_approaching"
    | "task_completion"
    | "budget_threshold"
    | "team_capacity";
  threshold: number;
  enabled: boolean;
  channels: ("email" | "slack" | "inapp")[];
  projectId?: string;
  createdAt: string;
};

export function AlertRulesManager() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    type: "overdue_tasks" as AlertRule["type"],
    threshold: 5,
    channels: ["inapp"] as AlertRule["channels"],
  });

  useEffect(() => {
    setMounted(true);
    loadRules();
  }, []);

  const loadRules = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("pv:alertRules");
      if (stored) {
        setRules(JSON.parse(stored));
      } else {
        // Initialize with default rules
        const defaultRules: AlertRule[] = [
          {
            id: "rule1",
            name: "Overdue Tasks Alert",
            type: "overdue_tasks",
            threshold: 5,
            enabled: true,
            channels: ["inapp", "email"],
            createdAt: new Date().toISOString(),
          },
          {
            id: "rule2",
            name: "Deadline Warning",
            type: "deadline_approaching",
            threshold: 7,
            enabled: true,
            channels: ["inapp"],
            createdAt: new Date().toISOString(),
          },
        ];
        setRules(defaultRules);
        localStorage.setItem("pv:alertRules", JSON.stringify(defaultRules));
      }
    } catch (error) {
      console.error("Error loading alert rules:", error);
    }
  };

  const saveRules = (updatedRules: AlertRule[]) => {
    setRules(updatedRules);
    localStorage.setItem("pv:alertRules", JSON.stringify(updatedRules));
  };

  const addRule = () => {
    if (!draft.name.trim()) return;

    const newRule: AlertRule = {
      id: `rule_${Date.now()}`,
      name: draft.name,
      type: draft.type,
      threshold: draft.threshold,
      enabled: true,
      channels: draft.channels,
      createdAt: new Date().toISOString(),
    };

    saveRules([...rules, newRule]);
    setDraft({
      name: "",
      type: "overdue_tasks",
      threshold: 5,
      channels: ["inapp"],
    });
    setAddOpen(false);
  };

  const toggleRule = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    saveRules(updated);
  };

  const deleteRule = (id: string) => {
    if (confirm("Are you sure you want to delete this alert rule?")) {
      saveRules(rules.filter((r) => r.id !== id));
    }
  };

  const toggleChannel = (
    ruleId: string,
    channel: "email" | "slack" | "inapp"
  ) => {
    const updated = rules.map((r) => {
      if (r.id === ruleId) {
        const channels = r.channels.includes(channel)
          ? r.channels.filter((c) => c !== channel)
          : [...r.channels, channel];
        return { ...r, channels };
      }
      return r;
    });
    saveRules(updated);
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case "overdue_tasks":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "deadline_approaching":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "task_completion":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "budget_threshold":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      case "team_capacity":
        return <AlertTriangle className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getRuleDescription = (rule: AlertRule) => {
    switch (rule.type) {
      case "overdue_tasks":
        return `Alert when ${rule.threshold} or more tasks are overdue`;
      case "deadline_approaching":
        return `Alert ${rule.threshold} days before project deadline`;
      case "task_completion":
        return `Alert when task completion rate drops below ${rule.threshold}%`;
      case "budget_threshold":
        return `Alert when budget usage exceeds ${rule.threshold}%`;
      case "team_capacity":
        return `Alert when team capacity exceeds ${rule.threshold}%`;
      default:
        return "Custom alert rule";
    }
  };

  if (!mounted) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Alert Rules</h2>
            <p className="text-sm text-muted-foreground">
              Configure custom thresholds and notifications
            </p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(!addOpen)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Rule
        </Button>
      </div>

      {/* Add new rule form */}
      {addOpen && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-accent/20">
          <h3 className="font-semibold mb-4">Create New Alert Rule</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rule Name
              </label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g., High Priority Overdue Alert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Rule Type
              </label>
              <select
                value={draft.type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    type: e.target.value as AlertRule["type"],
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="overdue_tasks">Overdue Tasks</option>
                <option value="deadline_approaching">
                  Deadline Approaching
                </option>
                <option value="task_completion">Task Completion Rate</option>
                <option value="budget_threshold">Budget Threshold</option>
                <option value="team_capacity">Team Capacity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Threshold
              </label>
              <Input
                type="number"
                value={draft.threshold}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    threshold: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {draft.type === "overdue_tasks" && "Number of overdue tasks"}
                {draft.type === "deadline_approaching" &&
                  "Days before deadline"}
                {draft.type === "task_completion" &&
                  "Minimum completion percentage"}
                {draft.type === "budget_threshold" &&
                  "Maximum budget percentage"}
                {draft.type === "team_capacity" &&
                  "Maximum capacity percentage"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notification Channels
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const channels = draft.channels.includes("inapp")
                      ? draft.channels.filter((c) => c !== "inapp")
                      : [...draft.channels, "inapp" as const];
                    setDraft({
                      ...draft,
                      channels: channels as AlertRule["channels"],
                    });
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    draft.channels.includes("inapp")
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">In-App</span>
                </button>
                <button
                  onClick={() => {
                    const channels = draft.channels.includes("email")
                      ? draft.channels.filter((c) => c !== "email")
                      : [...draft.channels, "email" as const];
                    setDraft({
                      ...draft,
                      channels: channels as AlertRule["channels"],
                    });
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    draft.channels.includes("email")
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </button>
                <button
                  onClick={() => {
                    const channels = draft.channels.includes("slack")
                      ? draft.channels.filter((c) => c !== "slack")
                      : [...draft.channels, "slack" as const];
                    setDraft({
                      ...draft,
                      channels: channels as AlertRule["channels"],
                    });
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    draft.channels.includes("slack")
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-accent"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Slack</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={addRule}>
                Create Rule
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No alert rules configured</p>
            <p className="text-sm">
              Create your first rule to start receiving alerts
            </p>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`border border-border rounded-lg p-4 transition-all ${
                rule.enabled ? "bg-card" : "bg-accent/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="shrink-0 mt-0.5">
                    {getRuleIcon(rule.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rule.name}</h4>
                      {rule.enabled ? (
                        <Badge variant="success" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {getRuleDescription(rule)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Channels:
                      </span>
                      {rule.channels.map((channel) => (
                        <button
                          key={channel}
                          onClick={() => toggleChannel(rule.id, channel)}
                          className="flex items-center gap-1 px-2 py-1 bg-accent rounded text-xs hover:bg-accent/80 transition-colors"
                        >
                          {channel === "email" && <Mail className="w-3 h-3" />}
                          {channel === "slack" && (
                            <MessageSquare className="w-3 h-3" />
                          )}
                          {channel === "inapp" && <Bell className="w-3 h-3" />}
                          <span className="capitalize">{channel}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      rule.enabled
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                        : "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20"
                    }`}
                    title={rule.enabled ? "Disable" : "Enable"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
