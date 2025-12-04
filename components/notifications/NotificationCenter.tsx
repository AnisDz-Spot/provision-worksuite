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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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

  useEffect(() => {
    setMounted(true);
    loadNotifications();

    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("pv:notifications");
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Initialize with sample notifications
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
          {
            id: "n3",
            type: "info",
            title: "New Team Member Added",
            message: "Eve has joined the team. Welcome!",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read: true,
            source: "system",
          },
        ];
        setNotifications(initial);
        localStorage.setItem("pv:notifications", JSON.stringify(initial));
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
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

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("pv:notifications", JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("pv:notifications", JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("pv:notifications", JSON.stringify(updated));
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
              className={`p-4 border-b border-border hover:bg-accent/30 transition-colors ${
                !notification.read ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4
                      className={`text-sm font-medium ${!notification.read ? "font-semibold" : ""}`}
                    >
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(notification.timestamp)}
                    </div>
                    {notification.source && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getSourceIcon(notification.source)}
                        <span className="capitalize">
                          {notification.source}
                        </span>
                      </div>
                    )}
                    {notification.projectName && (
                      <Badge variant="secondary" className="text-xs">
                        {notification.projectName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
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
