"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { playMessageTone } from "@/lib/notificationSound";

type ToastNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
};

export function ChatNotificationToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

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
          };

          setNotifications((prev) => [toast, ...prev].slice(0, 3)); // Keep max 3

          // Auto-dismiss after 5 seconds
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

  if (!mounted || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-card border-2 border-primary shadow-lg rounded-lg p-4 min-w-[300px] animate-in slide-in-from-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">{notif.title}</div>
              <div className="text-sm text-muted-foreground">
                {notif.message}
              </div>
            </div>
            <button
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notif.id)
                )
              }
              className="p-1 hover:bg-accent rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
