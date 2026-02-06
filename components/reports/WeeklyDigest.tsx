"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";

// Import types
import { DigestSchedule, DigestData, RecipientUser } from "./digest/types";

// Import utilities
import {
  buildSlackPayload,
  buildTeamsCard,
  generateHTMLDigest,
} from "@/lib/reports/digest-utils";

// Import sub-components
import { DigestSettingsModal } from "./digest/DigestSettingsModal";
import { DigestPreviewModal } from "./digest/DigestPreviewModal";
import { DigestCardContent } from "./digest/DigestCardContent";

type WeeklyDigestProps = {
  projectId?: string | number;
};

export function WeeklyDigest({ projectId }: WeeklyDigestProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<DigestSchedule>({
    enabled: false,
    dayOfWeek: 1, // Monday
    time: "09:00",
    recipients: [],
  });
  const [users, setUsers] = useState<RecipientUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [digestData, setDigestData] = useState<DigestData | null>(null);
  const [showConfigError, setShowConfigError] = useState(false);

  const { currentUser: user, isAdmin } = useAuth();
  const isMasterAdmin =
    isAdmin || user?.role === "Administrator" || (user as any)?.isGlobalAdmin;

  // Guard to prevent saving on initial load
  const skipSaveRef = React.useRef(true);

  // Load stored settings (webhooks from localStorage, schedule from API)
  React.useEffect(() => {
    try {
      // Webhooks are now server-side, no longer loading from localStorage

      // Fetch digest settings from API
      const fetchSettings = async () => {
        try {
          const res = await fetch("/api/digest-settings");
          if (res.status === 401) return;
          const json = await res.json();
          if (json.success && json.data) {
            setSchedule({
              enabled: json.data.enabled,
              dayOfWeek: json.data.dayOfWeek,
              time: json.data.time,
              recipients: json.data.recipients || [],
            });
          }
        } catch (e) {
          console.error("Failed to fetch digest settings", e);
        } finally {
          setHasLoadedSettings(true);
          // Wait a bit before allowing saves to trigger, to letting the loaded data settle
          setTimeout(() => {
            skipSaveRef.current = false;
          }, 1000);
        }
      };
      fetchSettings();

      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          // Check if current user is Master Admin (Global Admin)
          // Handled by useAuth hook now

          const { shouldUseDatabaseData } = await import("@/lib/dataSource");
          let data = [];
          if (shouldUseDatabaseData()) {
            const res = await fetch("/api/users");
            const json = await res.json();
            if (json.success) data = json.data;
          } else {
            const { loadUsers } = await import("@/lib/data");
            data = await loadUsers();
          }
          setUsers(
            data.map((u: any) => ({
              id: u.id ?? u.uid,
              name: u.name,
              email: u.email,
              avatar:
                u.avatar_url ||
                u.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
            })),
          );
        } catch (e) {
          console.error("Failed to fetch users for digest", e);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    } catch {}
  }, []);

  // Save schedule to API whenever it changes (debounced)
  React.useEffect(() => {
    if (!hasLoadedSettings || skipSaveRef.current) return;

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetchWithCsrf("/api/digest-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(schedule),
        });
        if (!res.ok)
          console.error("[Digest] Failed to save settings", res.status);
      } catch (e) {
        console.error("Failed to save digest settings", e);
      }
    }, 1000); // Increased debounce to be safer

    return () => clearTimeout(timeoutId);
  }, [schedule, hasLoadedSettings]);

  // Load Real Data
  React.useEffect(() => {
    async function loadData() {
      const { shouldUseMockData } = await import("@/lib/dataSource");
      const { loadProjects, loadTasks } = await import("@/lib/data");

      if (shouldUseMockData()) {
        setDigestData({
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
              risk: "low",
            },
            {
              id: "p2",
              name: "Mobile App MVP",
              progress: 45,
              status: "At Risk",
              tasksCompleted: 6,
              upcomingDeadline: "Dec 20, 2025",
              risk: "high",
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
            "Completed user authentication module",
            "Deployed staging env",
          ],
          upcomingMilestones: [
            {
              title: "Beta Release",
              date: "Dec 12, 2025",
              project: "Mobile App MVP",
            },
          ],
        });
        return;
      }

      try {
        const [projects, tasks] = await Promise.all([
          loadProjects(),
          loadTasks(),
        ]);
        const completed = tasks.filter(
          (t) => t.status === "Done" || t.status === "Completed",
        ).length;
        const inProgress = tasks.filter(
          (t) => t.status === "In Progress",
        ).length;
        const blocked = tasks.filter((t) => t.status === "Blocked").length;
        const overallProgress =
          tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const rangeStr = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

        const projectSummaries = projects.map((p) => ({
          id: p.id,
          name: p.name,
          progress: p.progress || 0,
          status: p.status,
          tasksCompleted: tasks.filter(
            (t) =>
              String(t.projectId) === String(p.id) &&
              (t.status === "Done" || t.status === "Completed"),
          ).length,
          upcomingDeadline: p.deadline
            ? new Date(p.deadline).toLocaleDateString()
            : "N/A",
          risk: (p.priority === "high" ? "high" : "low") as "high" | "low",
        }));

        setDigestData({
          weekRange: rangeStr,
          summary: {
            tasksCompleted: completed,
            tasksInProgress: inProgress,
            tasksBlocked: blocked,
            progressPercent: overallProgress,
            velocityChange: "+5%",
            budgetUtilization: 0,
            hoursLogged: 0,
            teamUtilization: 0,
          },
          lastWeekSummary: {
            tasksCompleted: Math.max(0, completed - 2),
            tasksInProgress: inProgress,
            tasksBlocked: blocked,
            progressPercent: Math.max(0, overallProgress - 5),
            hoursLogged: 0,
            teamUtilization: 0,
          },
          projects: projectSummaries,
          blockers: [],
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
      }
    }
    loadData();
  }, [projectId]);

  const removeRecipient = (email: string) => {
    setSchedule({
      ...schedule,
      recipients: schedule.recipients.filter((r) => r !== email),
    });
  };

  const exportAsHTML = () => {
    if (!digestData) return;
    const htmlContent = generateHTMLDigest(digestData);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly-digest-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendDigest = async () => {
    if (!digestData || schedule.recipients.length === 0) {
      showToast("Please configure recipients first.", "warning");
      return;
    }
    setSendingEmail(true);
    try {
      const htmlContent = generateHTMLDigest(digestData);
      const res = await fetchWithCsrf("/api/digest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent,
          weekRange: digestData.weekRange,
          summary: digestData.summary,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Digest sent to ${data.recipients} recipient(s)!`);
      } else {
        if (data.error && data.error.includes("provider not configured")) {
          setShowConfigError(true);
        } else {
          showToast(`Failed: ${data.error}`, "error");
        }
      }
    } catch (error) {
      showToast("Error sending digest", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const postToSlack = async () => {
    if (!digestData) return;
    try {
      const payload = buildSlackPayload(digestData);
      const res = await fetchWithCsrf("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "slack",
          payload,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Posted to Slack!");
      } else {
        showToast(`Slack error: ${data.error}`, "error");
      }
    } catch (e: any) {
      showToast(`Slack error: ${e.message}`, "error");
    }
  };

  const postToTeams = async () => {
    if (!digestData) return;
    try {
      const payload = buildTeamsCard(digestData);
      const res = await fetchWithCsrf("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "teams",
          payload,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Posted to Teams!");
      } else {
        showToast(`Teams error: ${data.error}`, "error");
      }
    } catch (e: any) {
      showToast(`Teams error: ${e.message}`, "error");
    }
  };

  return (
    <Card className="p-6">
      {!digestData ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground italic">
            Preparing your weekly digest...
          </p>
        </div>
      ) : (
        <DigestCardContent
          schedule={schedule}
          digestData={digestData}
          sendingEmail={sendingEmail}
          setShowSettings={setShowSettings}
          setShowPreview={setShowPreview}
          setSchedule={setSchedule}
          sendDigest={sendDigest}
          exportAsHTML={exportAsHTML}
          exportSlackJSON={() => {
            if (!digestData) return;
            const blob = new Blob(
              [JSON.stringify(buildSlackPayload(digestData), null, 2)],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `weekly-digest-slack.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          exportTeamsJSON={() => {
            if (!digestData) return;
            const blob = new Blob(
              [JSON.stringify(buildTeamsCard(digestData), null, 2)],
              { type: "application/json" },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `weekly-digest-teams.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          postToSlack={postToSlack}
          postToTeams={postToTeams}
          removeRecipient={removeRecipient}
        />
      )}

      {/* Modals are always rendered to keep Hook count stable */}
      <DigestSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        schedule={schedule}
        setSchedule={setSchedule}
        users={users}
        loadingUsers={loadingUsers}
      />

      <DigestPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        digestData={digestData}
      />

      <Modal open={showConfigError} onOpenChange={setShowConfigError} size="sm">
        <div className="text-center">
          <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Email Not Configured</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {isMasterAdmin
              ? "You haven't set up an email provider yet. Please configure your SMTP or API settings to send digests."
              : "The email system is not configured. Please contact your administrator to set up the email provider."}
          </p>
          <div className="flex flex-col gap-2">
            {isMasterAdmin && (
              <Button
                onClick={() => {
                  setShowConfigError(false);
                  router.push("/settings/email");
                }}
                className="w-full"
              >
                Go to Email Settings
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setShowConfigError(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
