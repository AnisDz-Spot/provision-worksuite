"use client";
import { useEffect, useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { playMessageTone } from "@/lib/notificationSound";

type ToastNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
};

export function ChatNotificationToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [allMessages, setAllMessages] = useState<ToastNotification[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("pv:chatMessages");
      if (stored) {
        const parsed = JSON.parse(stored);
        setAllMessages(
          parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function setupChatToasts() {
      try {
        const { shouldUseMockData } = await import("@/lib/dataSource");
        if (!shouldUseMockData()) return;

        const { startChatNotificationSimulation } =
          await import("@/lib/chatNotificationSimulator");

        const cleanup = startChatNotificationSimulation((chatNotif) => {
          const toast: ToastNotification = {
            id: chatNotif.id,
            title: chatNotif.from,
            message: chatNotif.message,
            timestamp: new Date(chatNotif.timestamp),
            read: false,
          };

          // Add to toast notifications (visible toasts)
          setNotifications((prev) => [toast, ...prev].slice(0, 3));

          // Add to all messages (persistent)
          setAllMessages((prev) => {
            const updated = [toast, ...prev];
            // Save to localStorage
            try {
              localStorage.setItem("pv:chatMessages", JSON.stringify(updated));
            } catch (error) {
              console.error("Failed to save messages:", error);
            }
            return updated;
          });

          // Auto-dismiss toast after 5 seconds
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== toast.id));
          }, 5000);
        }, 60000); // Check every 60 seconds

        return cleanup;
      } catch (error) {
        console.error("Failed to setup chat toasts:", error);
      }
    }

    setupChatToasts();
  }, [mounted]);

  const unreadCount = allMessages.filter((m) => !m.read).length;

  const markAsRead = (id: string) => {
    setAllMessages((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, read: true } : m));
      try {
        localStorage.setItem("pv:chatMessages", JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    setAllMessages((prev) => {
      const updated = prev.map((m) => ({ ...m, read: true }));
      try {
        localStorage.setItem("pv:chatMessages", JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to save messages:", error);
      }
      return updated;
    });
  };

  const clearAll = () => {
    setAllMessages([]);
    try {
      localStorage.removeItem("pv:chatMessages");
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Toast Notifications */}
      {notifications.length > 0 && (
        <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-card border-2 border-primary shadow-lg rounded-lg p-4 min-w-[300px] animate-in slide-in-from-right"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">
                    {notif.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {notif.message}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNotifications((prev) =>
                      prev.filter((n) => n.id !== notif.id)
                    );
                    markAsRead(notif.id);
                  }}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Chat Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110"
          aria-label="Chat messages"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Messages Panel */}
        {showPanel && (
          <div className="absolute bottom-16 right-0 w-80 max-h-96 bg-card border-2 border-border shadow-xl rounded-lg overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between bg-accent/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold">Chat Messages</h3>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs px-2 py-1 hover:bg-accent rounded text-primary"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {allMessages.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No messages yet
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {allMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 hover:bg-accent/10 cursor-pointer ${
                        !msg.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markAsRead(msg.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {msg.title}
                            </span>
                            {!msg.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {msg.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {allMessages.length > 0 && (
              <div className="p-2 border-t border-border">
                <button
                  onClick={clearAll}
                  className="w-full text-xs text-destructive hover:bg-destructive/10 py-1 rounded"
                >
                  Clear all messages
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
