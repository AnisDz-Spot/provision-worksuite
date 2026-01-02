"use client";
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { BellIcon, X, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { useToaster } from "@/components/ui/Toaster";
import { fetchWithCsrf } from "@/lib/csrf-client";

type Notification = {
  id: string;
  userId?: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  requiresAcceptance?: boolean;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  // Legacy support for mock data icons
  severity?: "info" | "success" | "warning" | "error";
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadNotifications();

    // Check for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const { show } = useToaster();

  const [processingId, setProcessingId] = useState<string | null>(null);

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
              let severity: "info" | "success" | "warning" | "error" = "info";
              if (n.type === "invitation_accepted") severity = "success";
              if (n.type === "invitation_rejected") severity = "error";
              if (["info", "success", "warning", "error"].includes(n.type)) {
                severity = n.type;
              }

              return {
                ...n,
                // Ensure critical fields match Notification type
                severity,
                id: n.id.toString(),
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
        const parsed = JSON.parse(stored);
        localNotifications = parsed.map((n: any) => ({
          ...n,
          isRead: n.read ?? n.isRead,
          createdAt: n.timestamp ?? n.createdAt,
          severity: n.type,
        }));
      }
    } catch (error) {
      console.error("Error loading notifications from localStorage:", error);
    }

    // 3. Merge and Deduplicate (prefer DB over Local if ID collision, though unlikely)
    const combined = [...dbNotifications];
    const dbIds = new Set(dbNotifications.map((n) => n.id));

    localNotifications.forEach((n) => {
      // Only add if not already present (avoid duplicates if ID conflicts)
      // Local IDs are usually strings like "overdue_...", DB IDs are numbers/strings
      if (!dbIds.has(n.id)) {
        combined.push(n);
      }
    });

    // Sort by Date Descending
    combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setNotifications(combined);
  };

  // Note: Chat notifications are now handled by ChatNotificationToast (floating chat box)
  // NotificationBell only shows system/project notifications, not chat messages
  // Admin messages older than 10 minutes appear here only if user is still active

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  async function markAsRead(id: string) {
    if (processingId) return;
    setProcessingId(id);
    if (shouldUseDatabaseData()) {
      try {
        await fetchWithCsrf(`/api/notifications/${id}/read`, { method: "PUT" });
      } catch (e) {
        console.error("Failed to mark notification as read", e);
      }
    }

    const updated = notifications.map((n: Notification) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);

    if (!shouldUseDatabaseData()) {
      localStorage.setItem("pv:notifications", JSON.stringify(updated));
    }
    // Remove unread count locally
    setProcessingId(null);
  }

  async function deleteNotification(id: string) {
    if (processingId) return;
    setProcessingId(id);
    if (shouldUseDatabaseData()) {
      try {
        await fetchWithCsrf(`/api/notifications/${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Failed to delete notification", e);
      }
    }

    const updated = notifications.filter((n: Notification) => n.id !== id);
    setNotifications(updated);

    if (!shouldUseDatabaseData()) {
      localStorage.setItem("pv:notifications", JSON.stringify(updated));
    }
    setProcessingId(null);
  }

  async function handleAccept(id: string) {
    try {
      const res = await fetchWithCsrf(`/api/notifications/${id}/accept`, {
        method: "POST",
      });
      if (res.ok) {
        show("success", "Invitation accepted");
        loadNotifications();
      } else {
        show("error", "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Accept error:", error);
      show("error", "An error occurred");
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetchWithCsrf(`/api/notifications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ note: "Declined by user" }),
      });
      if (res.ok) {
        show("success", "Invitation declined");
        loadNotifications();
      } else {
        show("error", "Failed to decline invitation");
      }
    } catch (error) {
      console.error("Reject error:", error);
      show("error", "An error occurred");
    }
  }

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
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

  // Filter notifications to only show those unread for 10+ minutes (if not important)
  const nowTime = new Date().getTime();
  const filteredNotifications = notifications.filter((n: Notification) => {
    if (n.isRead) return true; // Always show read notifications
    if (n.requiresAcceptance) return true; // Always show important actions

    const notifTime = new Date(n.createdAt).getTime();
    const ageMinutes = (nowTime - notifTime) / (1000 * 60);

    // Only show unread notifications if they're 10+ minutes old
    return ageMinutes >= 10;
  });

  const unreadCount = filteredNotifications.filter(
    (n: Notification) => !n.isRead
  ).length;
  const recentNotifications = filteredNotifications.slice(0, 10);

  // Helper for icon colors
  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-500 bg-green-500/10";
      case "warning":
        return "text-amber-500 bg-amber-500/10";
      case "error":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-blue-500 bg-blue-500/10";
    }
  };

  const getIcon = (type: string) => {
    // reuse logic or import icons
    // For simplicity using simple conditional or existing icons
    // But let's just return nothing here as the UI code below expects children
    return null;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-label="Notifications"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <BellIcon width={20} height={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-18 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-80 bg-card border rounded-xl shadow-lg z-50 max-h-[80vh] md:max-h-96 overflow-hidden flex flex-col">
          <div className="p-4 border-b font-semibold flex items-center justify-between">
            <span>Notifications</span>
            <div className="flex items-center gap-1">
              <Link
                href="/settings/notifications"
                className="p-1 hover:bg-accent rounded"
                title="Notification settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <>
                {recentNotifications.map((n: Notification) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 border-b last:border-b-0 hover:bg-accent/10 transition-colors relative group",
                      !n.isRead && "bg-accent/5",
                      processingId === n.id && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {processingId === n.id ? (
                            <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          ) : (
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                n.type === "error"
                                  ? "bg-red-500"
                                  : n.type === "warning"
                                    ? "bg-amber-500"
                                    : n.type === "success"
                                      ? "bg-green-500"
                                      : "bg-blue-500"
                              )}
                            />
                          )}
                          <span className="font-medium text-sm">{n.title}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {n.message}
                        </div>

                        {n.requiresAcceptance &&
                          !n.acceptedAt &&
                          !n.rejectedAt && (
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(n.id);
                                }}
                                disabled={!!processingId}
                                className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-md hover:opacity-90 transition-opacity"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(n.id);
                                }}
                                disabled={!!processingId}
                                className="px-3 py-1 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-md hover:bg-secondary/80 transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          )}

                        <div className="text-xs text-muted-foreground flex items-center justify-between">
                          <span>{formatTimestamp(n.createdAt)}</span>
                          {n.acceptedAt && (
                            <span className="text-green-500 font-medium">
                              Accepted
                            </span>
                          )}
                          {n.rejectedAt && (
                            <span className="text-red-500 font-medium">
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!n.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="p-1 hover:bg-accent rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="p-1 hover:bg-accent rounded"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredNotifications.length > 5 && (
                  <Link
                    href="/settings/notifications"
                    className="block p-3 text-center text-sm text-primary hover:bg-accent/10 transition-colors"
                  >
                    View all notifications ({filteredNotifications.length})
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
