"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button"; // Check if Button exists at this path or if I need to use another
import { Card } from "@/components/ui/Card";
import { Laptop, Smartphone, Globe, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// Mock data type until API is ready/working
type Session = {
  id: string;
  deviceInfo: string;
  location: string;
  ipAddress: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/sessions", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      } else {
        // Fallback for dev if DB not pushed
        // setSessions([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke session");

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      showToast("Session revoked", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure? This will log you out of all other devices."))
      return;
    try {
      const res = await fetch(`/api/auth/sessions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to revoke all sessions");

      fetchSessions(); // Refresh to show only current
      showToast("All other sessions revoked", "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const getDeviceIcon = (info: string) => {
    if (
      info.toLowerCase().includes("mobile") ||
      info.toLowerCase().includes("android") ||
      info.toLowerCase().includes("iphone")
    )
      return <Smartphone className="w-5 h-5 text-gray-500" />;
    return <Laptop className="w-5 h-5 text-gray-500" />;
  };

  if (!sessions.length && !loading) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No active sessions found (or database not synced).</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Active Sessions</h3>
        {sessions.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeAll}
            className="text-red-600 hover:text-red-700"
          >
            Sign out all other devices
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <Card
            key={session.id}
            className="p-4 flex items-center justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                {getDeviceIcon(session.deviceInfo)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">
                    {session.deviceInfo || "Unknown Device"}
                  </p>
                  {session.isCurrent && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] uppercase font-bold rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />{" "}
                    {session.location || "Unknown Location"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last active:{" "}
                    {new Date(session.lastActiveAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevoke(session.id)}
              >
                Revoke
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
