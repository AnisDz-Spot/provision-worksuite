"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { shouldUseDatabaseData } from "@/lib/dataSource";

type CallType = "video" | "audio";

interface CallContextType {
  startCall: (
    type: CallType,
    targetUser: string,
    targetName?: string,
    conversationId?: string,
    isGroup?: boolean
  ) => Promise<void>;
  isCallPending: boolean;
  callError: string | null;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [isCallPending, setIsCallPending] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const startCall = useCallback(
    async (
      type: CallType,
      targetUser: string,
      targetName: string = "Meeting",
      conversationId?: string,
      isGroup: boolean = false
    ) => {
      if (isCallPending) return;
      setIsCallPending(true);
      setCallError(null);

      try {
        // 1. Determine participants
        let participantUids: string[] = [];
        let title = targetName;

        if (isGroup) {
          // Fetch group members
          const res = await fetch(`/api/chat-groups/${targetUser}/members`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.members)) {
              participantUids = data.members.map((m: any) => m.uid);
            }
          }
        } else {
          // Direct chat
          if (targetUser) {
            participantUids = [targetUser];
          }
        }

        // 2. Create meeting via API
        if (shouldUseDatabaseData()) {
          const response = await fetchWithCsrf("/api/meetings/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description: `Started from chat`,
              participantUids,
              type,
              conversationId,
            }),
          });

          const data = await response.json();
          if (data.success && data.meeting) {
            window.open(`/meetings/${data.meeting.roomId}`, "_blank");
          } else {
            const err = data.error || "Failed to initiate call";
            setCallError(err);
            console.error(err);
            alert(err); // Fallback feedback
          }
        } else {
          // Demo mode
          const mockRoomId = `demo-${Date.now()}`;
          window.open(`/meetings/${mockRoomId}`, "_blank");
        }
      } catch (error: any) {
        console.error("Error starting meeting:", error);
        setCallError("Failed to start meeting.");
        alert("Failed to start meeting.");
      } finally {
        setIsCallPending(false);
      }
    },
    [isCallPending]
  );

  return (
    <CallContext.Provider value={{ startCall, isCallPending, callError }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
