"use client";

import React, { useEffect } from "react";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { TimeTrackerProvider } from "@/components/timetracking/TimeTrackingWidget";
import { ChatProvider } from "@/components/chat/ChatContext";
import { CallProvider } from "@/components/meetings/CallContext";
import { initSentry } from "@/lib/sentry";

import { SessionProvider } from "next-auth/react";
import { LoadingProvider } from "@/context/LoadingContext";
import { GlobalLoader } from "@/components/ui/GlobalLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize Sentry on mount
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoadingProvider>
          <GlobalLoader />
          <ToastProvider>
            <SettingsProvider>
              <AuthProvider>
                <SidebarProvider>
                  <ChatProvider>
                    <CallProvider>
                      <TimeTrackerProvider>{children}</TimeTrackerProvider>
                    </CallProvider>
                  </ChatProvider>
                </SidebarProvider>
              </AuthProvider>
            </SettingsProvider>
          </ToastProvider>
        </LoadingProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
