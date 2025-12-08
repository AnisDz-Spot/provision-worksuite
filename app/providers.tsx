"use client";

import React from "react";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import { AuthProvider } from "@/components/auth/AuthContext";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { TimeTrackerProvider } from "@/components/timetracking/TimeTrackingWidget";
import { ChatProvider } from "@/components/chat/ChatContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <SidebarProvider>
              <ChatProvider>
                <TimeTrackerProvider>{children}</TimeTrackerProvider>
              </ChatProvider>
            </SidebarProvider>
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
