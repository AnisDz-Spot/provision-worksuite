"use client";
import { useState, useEffect, useRef } from "react";
import { BellIcon, X, Check, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Notification = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId?: string;
  projectName?: string;
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

  const loadNotifications = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("pv:notifications");
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  // Setup chat notification simulation in dummy mode
  useEffect(() => {
    if (!mounted) return;

    async function setupChatSimulation() {
      try {
        const { shouldUseMockData } = await import("@/lib/dataSource");
        if (!shouldUseMockData()) return;

        const { startChatNotificationSimulation } =
          await import("@/lib/chatNotificationSimulator");

        const cleanup = startChatNotificationSimulation((chatNotif) => {
          // Create a notification for the chat message
          const notification: Notification = {
            id: chatNotif.id,
            type: "info",
            title: `New message from ${chatNotif.from}`,
            message: chatNotif.message,
            timestamp: chatNotif.timestamp,
            read: false,
          };

          // Add to notifications
          const stored = localStorage.getItem("pv:notifications");
          const current: Notification[] = stored ? JSON.parse(stored) : [];
          const updated = [notification, ...current];

          setNotifications(updated);
          localStorage.setItem("pv:notifications", JSON.stringify(updated));
        }, 60000 /* Check every 60 seconds */);

        return cleanup;
      } catch (error) {
        console.error("Failed to setup chat simulation:", error);
      }
    }

    setupChatSimulation();
  }, [mounted]);

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

  function markAsRead(id: string) {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem("pv:notifications", JSON.stringify(updated));
  }

  function deleteNotification(id: string) {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("pv:notifications", JSON.stringify(updated));
  }

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

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

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
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
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
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <>
                {recentNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 border-b last:border-b-0 hover:bg-accent/10 transition-colors",
                      !n.read && "bg-accent/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{n.title}</span>
                          {!n.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {n.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(n.timestamp)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-1 hover:bg-accent rounded"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1 hover:bg-accent rounded"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length > 5 && (
                  <Link
                    href="/settings/notifications"
                    className="block p-3 text-center text-sm text-primary hover:bg-accent/10 transition-colors"
                  >
                    View all notifications ({notifications.length})
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
