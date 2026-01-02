"use client";
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import {
  Bell,
  BellRing,
  Check,
  X,
  Filter,
  Settings,
  Mail,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { shouldUseMockData, shouldUseDatabaseData } from "@/lib/dataSource";
import { fetchWithCsrf } from "@/lib/csrf-client";

export type Notification = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: string;
  projectName?: string;
  actionUrl?: string;
  source?: "system" | "email" | "slack";
};

type NotificationCenterProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function NotificationCenter({
  isOpen = true,
  onClose,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "project">("all");
  const [mounted, setMounted] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Helper for icon colors
  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-amber-600 bg-amber-100";
      case "error":
        return "text-red-600 bg-red-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  useEffect(() => {
    setMounted(true);
    loadNotifications();

    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    if (typeof window === "undefined") return;

    let dbNotifications: Notification[] = [];
    let localNotifications: Notification[] = [];

    // 1. Fetch from Database
    if (shouldUseDatabaseData()) {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            dbNotifications = result.data.map((n: any) => {
              // Map backend types to frontend visual types
              let visualType: "info" | "success" | "warning" | "error" = "info";
              if (n.type === "project_invitation") visualType = "info";
              if (n.type === "invitation_accepted") visualType = "success";
              if (n.type === "invitation_rejected") visualType = "error";
              if (
                n.type === "warning" ||
                n.type === "error" ||
                n.type === "success" ||
                n.type === "info"
              ) {
                visualType = n.type;
              }

              return {
                id: n.id.toString(), // Ensure ID is string
                type: visualType,
                title: n.title,
                message: n.message,
                timestamp: n.createdAt,
                read: n.isRead,
                projectId: n.projectId,
                projectName: n.projectName || undefined,
                source: "system",
              };
            });
          }
        }
      } catch (error) {
        console.error("Error fetching notifications from DB:", error);
      }
    }

    // 2. Fetch from Local Storage
    try {
      const stored = localStorage.getItem("pv:notifications");
      if (stored) {
        localNotifications = JSON.parse(stored);
      } else if (shouldUseMockData()) {
        const initial: Notification[] = [
          {
            id: "n1",
            type: "warning",
            title: "Project Alpha - Overdue Tasks",
            message: "5 tasks are overdue. Please review and update.",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            projectId: "p1",
            projectName: "Project Alpha",
            source: "system",
          },
          // ... (simplified initial mock data for brevity if reused, or keep existing logic)
          {
            id: "n2",
            type: "success",
            title: "Project Beta - Milestone Completed",
            message: "Development Sprint 1 milestone has been completed!",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            read: false,
            projectId: "p2",
            projectName: "Project Beta",
            source: "system",
          },
        ];
        localNotifications = initial;
        // Only save if strictly in mock mode to avoid overwriting real setup?
        // Actually, we should respect the logic: "if mock mode, seed data"
        localStorage.setItem("pv:notifications", JSON.stringify(initial));
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }

    // 3. Merge
    const dbIds = new Set(dbNotifications.map((n) => n.id));
    const combined = [...dbNotifications];
    localNotifications.forEach((n) => {
      if (!dbIds.has(n.id)) {
        combined.push(n);
      }
    });

    // Sort
    combined.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(combined);
  };

  const checkForNewNotifications = async () => {
    if (typeof window === "undefined") return;

    // Check alert rules and generate notifications
    const rules = JSON.parse(localStorage.getItem("pv:alertRules") || "[]");

    // Load projects and tasks using the new data loader
    let projects: any[] = [];
    let tasks: any[] = [];
    try {
      const { loadProjects, loadTasks } = await import("@/lib/data");
      projects = await loadProjects();
      tasks = await loadTasks();
    } catch (error) {
      console.error("Failed to load data for notifications:", error);
      return;
    }

    const newNotifications: Notification[] = [];

    rules.forEach((rule: any) => {
      if (!rule.enabled) return;

      // Check overdue tasks rule
      if (rule.type === "overdue_tasks") {
        projects.forEach((project: any) => {
          const projectTasks = tasks.filter(
            (t: any) => t.projectId === project.id
          );
          const overdueTasks = projectTasks.filter(
            (t: any) =>
              t.dueDate &&
              new Date(t.dueDate) < new Date() &&
              t.status !== "done"
          );

          if (overdueTasks.length >= rule.threshold) {
            // Check if we already notified about this today
            const notificationKey = `overdue_${project.id}_${new Date().toDateString()}`;
            const alreadyNotified = notifications.some(
              (n) => n.id === notificationKey
            );

            if (!alreadyNotified) {
              newNotifications.push({
                id: notificationKey,
                type: "warning",
                title: `${project.name} - Overdue Tasks Alert`,
                message: `${overdueTasks.length} tasks are overdue (threshold: ${rule.threshold})`,
                timestamp: new Date().toISOString(),
                read: false,
                projectId: project.id,
                projectName: project.name,
                source: "system",
              });
            }
          }
        });
      }

      // Check deadline approaching rule
      if (rule.type === "deadline_approaching") {
        projects.forEach((project: any) => {
          if (project.deadline) {
            const daysUntilDeadline = Math.ceil(
              (new Date(project.deadline).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (daysUntilDeadline <= rule.threshold && daysUntilDeadline > 0) {
              const notificationKey = `deadline_${project.id}_${daysUntilDeadline}`;
              const alreadyNotified = notifications.some(
                (n) => n.id === notificationKey
              );

              if (!alreadyNotified) {
                newNotifications.push({
                  id: notificationKey,
                  type: "warning",
                  title: `${project.name} - Deadline Approaching`,
                  message: `Only ${daysUntilDeadline} days remaining until deadline`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  projectId: project.id,
                  projectName: project.name,
                  source: "system",
                });
              }
            }
          }
        });
      }
    });

    if (newNotifications.length > 0) {
      const updated = [...newNotifications, ...notifications];
      setNotifications(updated);
      localStorage.setItem("pv:notifications", JSON.stringify(updated));
    }
  };

  const markAsRead = async (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    if (shouldUseDatabaseData()) {
      // Assuming fetchWithCsrf and mapNotificationType are defined elsewhere
      await fetchWithCsrf(`/api/notifications/${id}/read`, { method: "PUT" });
    } else {
      const updated = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      localStorage.setItem("pv:notifications", JSON.stringify(updated));
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setProcessingId(null);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("pv:notifications", JSON.stringify(updated));
  };

  const deleteNotification = async (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    if (shouldUseDatabaseData()) {
      // Assuming fetchWithCsrf is defined elsewhere
      await fetchWithCsrf(`/api/notifications/${id}`, { method: "DELETE" });
    } else {
      const updated = notifications.filter((n) => n.id !== id);
      setNotifications(updated);
      localStorage.setItem("pv:notifications", JSON.stringify(updated));
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setProcessingId(null);
  };

  const handleAccept = async (id: string) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      if (shouldUseDatabaseData()) {
        // Assuming fetchWithCsrf is defined elsewhere
        const res = await fetchWithCsrf(`/api/notifications/${id}/accept`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.success) {
          // Refresh entire page to update permissions
          window.location.reload();
          return;
        }
      } else {
        // Mock
        deleteNotification(id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem("pv:notifications", JSON.stringify([]));
  };

  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "project":
        return notifications.filter((n) => n.projectId);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "error":
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "email":
        return <Mail className="w-3 h-3" />;
      case "slack":
        return <MessageSquare className="w-3 h-3" />;
      default:
        return <Bell className="w-3 h-3" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!mounted) return null;

  return (
    <Card className="w-full max-w-2xl">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <BellRing className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/settings/notifications">
              <Settings className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filter === "unread"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter("project")}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            filter === "project"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          Projects ({notifications.filter((n) => n.projectId).length})
        </button>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[500px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-4 rounded-xl border border-border hover:bg-accent/50 transition-all cursor-pointer group relative ${
                !notification.read ? "bg-accent/20" : "bg-card"
              } ${processingId === notification.id ? "opacity-60 pointer-events-none" : ""}`}
            >
              <div className="flex gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor(
                    notification.type
                  )}`}
                >
                  {processingId === notification.id ? (
                    <div className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    getIcon(notification.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3
                        className={`text-base mb-1 ${
                          !notification.read ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-background rounded-lg"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {notification.type === "info" && // mapped type is info for invites
                    !notification.read && (
                      <div className="flex gap-3 mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(notification.id);
                          }}
                          disabled={!!processingId}
                          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                          {processingId === notification.id
                            ? "Accepting..."
                            : "Accept Invitation"}
                        </button>
                      </div>
                    )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    {!notification.read && (
                      <span className="flex items-center gap-1 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
