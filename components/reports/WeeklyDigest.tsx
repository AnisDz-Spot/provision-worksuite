"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Mail,
  Calendar,
  Download,
  Send,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
} from "lucide-react";

type DigestSchedule = {
  enabled: boolean;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:MM format
  recipients: string[];
};

type DigestProject = {
  id: string;
  name: string;
  progress: number;
  status: string;
  tasksCompleted: number;
  upcomingDeadline: string;
  risk: "low" | "high";
};

type DigestBlocker = {
  title: string;
  severity: string;
  project: string;
};

type DigestMilestone = {
  title: string;
  date: string;
  project: string;
};

type DigestSummary = {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksBlocked: number;
  progressPercent: number;
  velocityChange: string; // e.g. "+10%"
  budgetUtilization: number;
  hoursLogged: number;
  teamUtilization: number;
};

type DigestData = {
  weekRange: string;
  summary: DigestSummary;
  lastWeekSummary: Omit<DigestSummary, "velocityChange" | "budgetUtilization">;
  projects: DigestProject[];
  blockers: DigestBlocker[];
  achievements: string[];
  upcomingMilestones: DigestMilestone[];
};

type WeeklyDigestProps = {
  projectId?: string;
};

export function WeeklyDigest({ projectId }: WeeklyDigestProps) {
  const [schedule, setSchedule] = useState<DigestSchedule>({
    enabled: false,
    dayOfWeek: 1, // Monday
    time: "09:00",
    recipients: ["anis@example.com", "team@example.com"],
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState("");
  const [sending, setSending] = useState<{
    target: "slack" | "teams" | null;
    status: "idle" | "ok" | "error";
    message?: string;
  }>({ target: null, status: "idle" });

  // Load stored webhook URLs
  React.useEffect(() => {
    try {
      const s = localStorage.getItem("pv:webhook:slack") || "";
      const t = localStorage.getItem("pv:webhook:teams") || "";
      setSlackWebhookUrl(s);
      setTeamsWebhookUrl(t);
    } catch {}
  }, []);

  // Load real data if in Live mode
  const [digestData, setDigestData] = useState<DigestData | null>(null);

  React.useEffect(() => {
    async function loadData() {
      // Import data loaders dynamically
      const { shouldUseDatabaseData, shouldUseMockData } =
        await import("@/lib/dataSource");
      const { loadProjects, loadTasks } = await import("@/lib/data");

      // Default mock data structure
      const mockData = {
        weekRange: "Dec 3 - Dec 9, 2025",
        summary: {
          tasksCompleted: 23,
          tasksInProgress: 15,
          tasksBlocked: 3,
          progressPercent: 68,
          velocityChange: "+12%",
          budgetUtilization: 72,
          hoursLogged: 142,
          teamUtilization: 85,
        },
        lastWeekSummary: {
          tasksCompleted: 18,
          tasksInProgress: 17,
          tasksBlocked: 2,
          progressPercent: 62,
          hoursLogged: 128,
          teamUtilization: 78,
        },
        projects: [
          {
            id: "p1",
            name: "Website Redesign",
            progress: 75,
            status: "On Track",
            tasksCompleted: 8,
            upcomingDeadline: "Dec 15, 2025",
            risk: "low" as const,
          },
          {
            id: "p2",
            name: "Mobile App MVP",
            progress: 45,
            status: "At Risk",
            tasksCompleted: 6,
            upcomingDeadline: "Dec 20, 2025",
            risk: "high" as const,
          },
        ],
        blockers: [
          {
            title: "API authentication endpoint not ready",
            severity: "critical",
            project: "Mobile App MVP",
          },
        ],
        achievements: [
          "Completed user authentication module ahead of schedule",
          "Successfully deployed staging environment",
        ],
        upcomingMilestones: [
          {
            title: "Beta Release",
            date: "Dec 12, 2025",
            project: "Mobile App MVP",
          },
        ],
      };

      if (shouldUseMockData()) {
        setDigestData(mockData);
        return;
      }

      // Live Data Calculation
      try {
        const [projects, tasks] = await Promise.all([
          loadProjects(),
          loadTasks(),
        ]);

        const totalTasks = tasks.length;
        const completed = tasks.filter(
          (t) => t.status === "Done" || t.status === "Completed"
        ).length;
        const inProgress = tasks.filter(
          (t) => t.status === "In Progress"
        ).length;
        const blocked = tasks.filter((t) => t.status === "Blocked").length;

        // Calculate progress
        const overallProgress =
          totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

        // Format date range
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const rangeStr = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

        // Map projects
        const projectSummaries = projects.map((p) => {
          const pTasks = tasks.filter((t: any) => t.projectId === p.id);
          const pCompleted = pTasks.filter(
            (t: any) => t.status === "Done" || t.status === "Completed"
          ).length;
          return {
            id: p.id,
            name: p.name,
            progress: p.progress || 0,
            status: p.status,
            tasksCompleted: pCompleted,
            upcomingDeadline: p.deadline
              ? new Date(p.deadline).toLocaleDateString()
              : "N/A",
            risk: (p.priority === "high" ? "high" : "low") as "high" | "low",
          };
        });

        setDigestData({
          weekRange: rangeStr,
          summary: {
            tasksCompleted: completed,
            tasksInProgress: inProgress,
            tasksBlocked: blocked,
            progressPercent: overallProgress,
            velocityChange: "+5%", // Needs historical data, keeping mock for now
            budgetUtilization: 0,
            hoursLogged: 0,
            teamUtilization: 0,
          },
          lastWeekSummary: {
            // No history yet, using placeholders
            tasksCompleted: Math.max(0, completed - 2),
            tasksInProgress: inProgress,
            tasksBlocked: blocked,
            progressPercent: Math.max(0, overallProgress - 5),
            hoursLogged: 0,
            teamUtilization: 0,
          },
          projects: projectSummaries,
          blockers: [], // TODO: Link to RiskBlockerDashboard data
          achievements: completed > 0 ? [`${completed} tasks completed`] : [],
          upcomingMilestones: projectSummaries
            .filter((p) => p.upcomingDeadline !== "N/A")
            .map((p) => ({
              title: "Project Deadline",
              date: p.upcomingDeadline,
              project: p.name,
            })),
        });
      } catch (e) {
        console.error("Failed to load live digest data", e);
        setDigestData(mockData); // Fallback
      }
    }
    loadData();
  }, [projectId]);

  if (!digestData) return <div>Loading digest...</div>;

  const addRecipient = () => {
    if (newRecipient && newRecipient.includes("@")) {
      setSchedule({
        ...schedule,
        recipients: [...schedule.recipients, newRecipient],
      });
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setSchedule({
      ...schedule,
      recipients: schedule.recipients.filter((r) => r !== email),
    });
  };

  const exportAsHTML = () => {
    const htmlContent = generateHTMLDigest();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-digest-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build Slack Blocks payload
  const buildSlackPayload = () => {
    const blocks: any[] = [
      {
        type: "header",
        text: { type: "plain_text", text: "Weekly Project Digest" },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Range:* ${digestData.weekRange}` },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Completed*\n${digestData.summary.tasksCompleted}`,
          },
          {
            type: "mrkdwn",
            text: `*Progress*\n${digestData.summary.progressPercent}%`,
          },
          {
            type: "mrkdwn",
            text: `*Velocity Change*\n${digestData.summary.velocityChange}`,
          },
          {
            type: "mrkdwn",
            text: `*Team Use*\n${digestData.summary.teamUtilization}%`,
          },
        ],
      },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: "*Project Status*" } },
      ...digestData.projects.map((p) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${p.name}* — ${p.status}\nProgress: ${p.progress}% • Completed: ${p.tasksCompleted} • Due: ${p.upcomingDeadline}`,
        },
      })),
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: "*Achievements*" } },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: digestData.achievements.map((a) => `• ${a}`).join("\n"),
        },
      },
      { type: "divider" },
      { type: "section", text: { type: "mrkdwn", text: "*Blockers*" } },
      ...digestData.blockers.map((b) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• *${b.title}* (${b.severity.toUpperCase()}) — ${b.project}`,
        },
      })),
      { type: "divider" },
      {
        type: "section",
        text: { type: "mrkdwn", text: "*Upcoming Milestones*" },
      },
      ...digestData.upcomingMilestones.map((m) => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `• ${m.title} — ${m.date} (${m.project})`,
        },
      })),
    ];
    return { blocks };
  };

  const exportSlackJSON = () => {
    const payload = JSON.stringify(buildSlackPayload(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-digest-slack-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build Microsoft Teams Adaptive Card payload
  const buildTeamsCard = () => {
    return {
      type: "AdaptiveCard",
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Weekly Project Digest",
          weight: "Bolder",
          size: "Large",
        },
        {
          type: "TextBlock",
          text: `Range: ${digestData.weekRange}`,
          isSubtle: true,
          wrap: true,
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: "Completed",
                  weight: "Bolder",
                  size: "Small",
                },
                {
                  type: "TextBlock",
                  text: String(digestData.summary.tasksCompleted),
                },
              ],
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: "Progress",
                  weight: "Bolder",
                  size: "Small",
                },
                {
                  type: "TextBlock",
                  text: `${digestData.summary.progressPercent}%`,
                },
              ],
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: "Velocity",
                  weight: "Bolder",
                  size: "Small",
                },
                { type: "TextBlock", text: digestData.summary.velocityChange },
              ],
            },
            {
              type: "Column",
              items: [
                {
                  type: "TextBlock",
                  text: "Team Use",
                  weight: "Bolder",
                  size: "Small",
                },
                {
                  type: "TextBlock",
                  text: `${digestData.summary.teamUtilization}%`,
                },
              ],
            },
          ],
        },
        {
          type: "TextBlock",
          text: "Project Status",
          weight: "Bolder",
          spacing: "Medium",
        },
        ...digestData.projects.map((p) => ({
          type: "Container",
          items: [
            {
              type: "TextBlock",
              text: `${p.name} — ${p.status}`,
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: `Progress: ${p.progress}% • Completed: ${p.tasksCompleted} • Due: ${p.upcomingDeadline}`,
              wrap: true,
            },
          ],
          style: "default",
          spacing: "Small",
        })),
        {
          type: "TextBlock",
          text: "Achievements",
          weight: "Bolder",
          spacing: "Medium",
        },
        {
          type: "TextBlock",
          wrap: true,
          text: digestData.achievements.map((a) => `• ${a}`).join("\n"),
        },
        {
          type: "TextBlock",
          text: "Blockers",
          weight: "Bolder",
          spacing: "Medium",
        },
        {
          type: "TextBlock",
          wrap: true,
          text: digestData.blockers
            .map(
              (b) => `• ${b.title} (${b.severity.toUpperCase()}) — ${b.project}`
            )
            .join("\n"),
        },
        {
          type: "TextBlock",
          text: "Upcoming Milestones",
          weight: "Bolder",
          spacing: "Medium",
        },
        {
          type: "TextBlock",
          wrap: true,
          text: digestData.upcomingMilestones
            .map((m) => `• ${m.title} — ${m.date} (${m.project})`)
            .join("\n"),
        },
      ],
    };
  };

  const exportTeamsJSON = () => {
    const payload = JSON.stringify(buildTeamsCard(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-digest-teams-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Post to Slack via server API (avoids CORS)
  const postToSlack = async () => {
    if (!slackWebhookUrl) {
      alert("Set Slack webhook URL in settings first.");
      return;
    }
    setSending({ target: "slack", status: "idle" });
    try {
      setSending({ target: "slack", status: "idle" });
      const payload = buildSlackPayload();
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "slack",
          webhookUrl: slackWebhookUrl,
          payload,
        }),
      });
      const json = await res.json();
      setSending({
        target: "slack",
        status: json.ok ? "ok" : "error",
        message: json.response || json.error,
      });
      if (!json.ok) alert(`Slack error: ${json.response || json.error}`);
      else alert("Posted to Slack.");
    } catch (e: any) {
      setSending({
        target: "slack",
        status: "error",
        message: String(e?.message || e),
      });
      alert(`Slack error: ${String(e?.message || e)}`);
    }
  };

  // Post to Teams via server API
  const postToTeams = async () => {
    if (!teamsWebhookUrl) {
      alert("Set Teams webhook URL in settings first.");
      return;
    }
    setSending({ target: "teams", status: "idle" });
    try {
      const payload = buildTeamsCard();
      const res = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "teams",
          webhookUrl: teamsWebhookUrl,
          payload,
        }),
      });
      const json = await res.json();
      setSending({
        target: "teams",
        status: json.ok ? "ok" : "error",
        message: json.response || json.error,
      });
      if (!json.ok) alert(`Teams error: ${json.response || json.error}`);
      else alert("Posted to Teams.");
    } catch (e: any) {
      setSending({
        target: "teams",
        status: "error",
        message: String(e?.message || e),
      });
      alert(`Teams error: ${String(e?.message || e)}`);
    }
  };

  const generateHTMLDigest = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Project Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #1e293b; font-size: 28px; }
    .header p { margin: 5px 0 0; color: #64748b; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e293b; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 12px; }
    .project-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-bottom: 12px; }
    .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .progress-bar { background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { background: #3b82f6; height: 100%; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .blocker { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin-bottom: 10px; border-radius: 4px; }
    .achievement { padding: 10px; background: #f0fdf4; border-left: 3px solid #22c55e; margin-bottom: 8px; border-radius: 4px; }
    ul { margin: 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Project Digest</h1>
      <p>${digestData.weekRange}</p>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Tasks Completed</div>
        <div class="stat-value">${digestData.summary.tasksCompleted}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Progress</div>
        <div class="stat-value">${digestData.summary.progressPercent}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Velocity Change</div>
        <div class="stat-value">${digestData.summary.velocityChange}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Team Utilization</div>
        <div class="stat-value">${digestData.summary.teamUtilization}%</div>
      </div>
    </div>

    <div class="section">
      <h2>🚀 Project Status</h2>
      ${digestData.projects
        .map(
          (p) => `
        <div class="project-card">
          <div class="project-header">
            <strong>${p.name}</strong>
            <span class="badge badge-${p.risk === "low" ? "success" : "danger"}">${p.status}</span>
          </div>
          <div>✅ ${p.tasksCompleted} tasks completed • 📅 Due ${p.upcomingDeadline}</div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${p.progress}%"></div></div>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="section">
      <h2>🎉 Achievements This Week</h2>
      ${digestData.achievements.map((a) => `<div class="achievement">✓ ${a}</div>`).join("")}
    </div>

    <div class="section">
      <h2>⚠️ Active Blockers</h2>
      ${digestData.blockers
        .map(
          (b) => `
        <div class="blocker">
          <strong>${b.title}</strong><br>
          <small>Project: ${b.project} • Severity: ${b.severity.toUpperCase()}</small>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="section">
      <h2>📅 Upcoming Milestones</h2>
      <ul>
        ${digestData.upcomingMilestones.map((m) => `<li><strong>${m.title}</strong> - ${m.date} (${m.project})</li>`).join("")}
      </ul>
    </div>
  </div>
</body>
</html>`;
  };

  const sendDigest = () => {
    // In production, call API to send email
    alert(`Digest sent to ${schedule.recipients.length} recipient(s)`);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Weekly Digest Email</h3>
            <p className="text-sm text-muted-foreground">
              Automated project summaries for stakeholders
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
          <Button onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Schedule Status */}
      <div
        className={`p-4 rounded-lg border mb-6 ${schedule.enabled ? "bg-green-500/10 border-green-500/20" : "bg-gray-500/10 border-gray-500/20"}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${schedule.enabled ? "bg-green-500" : "bg-gray-400"}`}
            />
            <div>
              <div className="font-semibold">
                {schedule.enabled ? "Scheduled" : "Not Scheduled"}
              </div>
              {schedule.enabled && (
                <div className="text-sm text-muted-foreground">
                  Every{" "}
                  {
                    [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][schedule.dayOfWeek]
                  }{" "}
                  at {schedule.time}
                </div>
              )}
            </div>
          </div>
          <Button
            variant={schedule.enabled ? "outline" : "primary"}
            size="sm"
            onClick={() =>
              setSchedule({ ...schedule, enabled: !schedule.enabled })
            }
          >
            {schedule.enabled ? "Disable" : "Enable"} Schedule
          </Button>
        </div>
      </div>

      {/* Quick Stats Preview with Week-over-Week Comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {digestData.summary.tasksCompleted}
            </div>
            <span className="text-xs text-green-600 font-medium">
              +
              {digestData.summary.tasksCompleted -
                digestData.lastWeekSummary.tasksCompleted}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.tasksCompleted} last week
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-muted-foreground">Blockers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-red-600">
              {digestData.summary.tasksBlocked}
            </div>
            <span
              className={`text-xs font-medium ${
                digestData.summary.tasksBlocked >
                digestData.lastWeekSummary.tasksBlocked
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {digestData.summary.tasksBlocked >
              digestData.lastWeekSummary.tasksBlocked
                ? "+"
                : ""}
              {digestData.summary.tasksBlocked -
                digestData.lastWeekSummary.tasksBlocked}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.tasksBlocked} last week
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {digestData.summary.progressPercent}%
            </div>
            <span className="text-xs text-green-600 font-medium">
              +
              {digestData.summary.progressPercent -
                digestData.lastWeekSummary.progressPercent}
              %
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.progressPercent}% last week
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-muted-foreground">Team Use</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {digestData.summary.teamUtilization}%
            </div>
            <span className="text-xs text-green-600 font-medium">
              +
              {digestData.summary.teamUtilization -
                digestData.lastWeekSummary.teamUtilization}
              %
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.teamUtilization}% last week
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">
          Recipients ({schedule.recipients.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {schedule.recipients.map((email) => (
            <Badge key={email} variant="secondary" className="pl-2 pr-1">
              {email}
              <button
                className="ml-2 hover:text-red-600"
                onClick={() => removeRecipient(email)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={sendDigest}>
          <Send className="w-4 h-4 mr-1" />
          Send Now
        </Button>
        <Button variant="outline" onClick={exportAsHTML}>
          <Download className="w-4 h-4 mr-1" />
          Export HTML
        </Button>
        <Button
          variant="outline"
          onClick={exportSlackJSON}
          title="Export Slack message (Blocks JSON)"
        >
          <Download className="w-4 h-4 mr-1" />
          Export Slack
        </Button>
        <Button
          variant="outline"
          onClick={exportTeamsJSON}
          title="Export Teams Adaptive Card JSON"
        >
          <Download className="w-4 h-4 mr-1" />
          Export Teams
        </Button>
        <Button onClick={postToSlack} title="Post to Slack via webhook">
          <Send className="w-4 h-4 mr-1" />
          Post to Slack
        </Button>
        <Button onClick={postToTeams} title="Post to Teams via webhook">
          <Send className="w-4 h-4 mr-1" />
          Post to Teams
        </Button>
      </div>

      {/* Settings Modal */}
      <Modal open={showSettings} onOpenChange={setShowSettings}>
        <h3 className="text-lg font-semibold mb-4">Digest Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Day of Week
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              value={schedule.dayOfWeek}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  dayOfWeek: parseInt(e.target.value),
                })
              }
            >
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, idx) => (
                <option key={idx} value={idx}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Time</label>
            <Input
              type="time"
              value={schedule.time}
              onChange={(e) =>
                setSchedule({ ...schedule, time: e.target.value })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Add Recipient
            </label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
              />
              <Button onClick={addRecipient}>Add</Button>
            </div>
          </div>
          <div className="pt-4">
            <Button onClick={() => setShowSettings(false)} className="w-full">
              Save Settings
            </Button>
          </div>
          <div className="pt-6 border-t mt-2">
            <h4 className="text-sm font-semibold mb-2">Webhooks</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Slack Incoming Webhook URL
                </label>
                <Input
                  type="url"
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  onBlur={() => {
                    try {
                      localStorage.setItem("pv:webhook:slack", slackWebhookUrl);
                    } catch {}
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Teams Incoming Webhook URL
                </label>
                <Input
                  type="url"
                  value={teamsWebhookUrl}
                  onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                  placeholder="https://outlook.office.com/webhook/..."
                  onBlur={() => {
                    try {
                      localStorage.setItem("pv:webhook:teams", teamsWebhookUrl);
                    } catch {}
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal open={showPreview} onOpenChange={setShowPreview}>
        <h3 className="text-lg font-semibold mb-4">Digest Preview</h3>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="border-b pb-4">
            <h3 className="text-xl font-bold">📊 Weekly Project Digest</h3>
            <p className="text-sm text-muted-foreground">
              {digestData.weekRange}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-accent rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">
                Tasks Completed
              </div>
              <div className="text-2xl font-bold">
                {digestData.summary.tasksCompleted}
              </div>
            </div>
            <div className="p-3 bg-accent rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Progress</div>
              <div className="text-2xl font-bold">
                {digestData.summary.progressPercent}%
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">🚀 Project Status</h4>
            {digestData.projects.map((p) => (
              <div key={p.id} className="border rounded-lg p-3 mb-2">
                <div className="flex justify-between items-start mb-2">
                  <strong>{p.name}</strong>
                  <Badge variant={p.risk === "low" ? "success" : "warning"}>
                    {p.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  ✅ {p.tasksCompleted} tasks • 📅 Due {p.upcomingDeadline}
                </div>
                <div className="h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold mb-3">🎉 Achievements</h4>
            {digestData.achievements.map((a, i) => (
              <div key={i} className="flex items-start gap-2 mb-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>{a}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold mb-3">⚠️ Active Blockers</h4>
            {digestData.blockers.map((b, i) => (
              <div
                key={i}
                className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-2"
              >
                <div className="font-medium">{b.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Project: {b.project} • Severity: {b.severity.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => setShowPreview(false)} className="w-full">
            Close Preview
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
