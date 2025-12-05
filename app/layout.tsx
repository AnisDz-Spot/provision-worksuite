"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/components/settings/SettingsProvider";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/layout/SidebarContext";
import { TimeTrackerProvider } from "@/components/timetracking/TimeTrackingWidget";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { TeamChat } from "@/components/team/TeamChat";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { AppLoader } from "@/components/ui/AppLoader";
import { cn } from "@/lib/utils";
import { shouldUseMockData, setDataModePreference } from "@/lib/dataSource";
import { isDatabaseConfigured } from "@/lib/setup";
import { Modal } from "@/components/ui/Modal";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <SettingsProvider>
              <AuthProvider>
                <SidebarProvider>
                  <TimeTrackerProvider>
                    <MainLayout>{children}</MainLayout>
                  </TimeTrackerProvider>
                </SidebarProvider>
              </AuthProvider>
            </SettingsProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mode, setMode] = React.useState<string | null>(null);
  const [showModeModal, setShowModeModal] = React.useState(false);
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  // All hooks must be called before any return!
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser?.isAdmin) {
      const pref = localStorage.getItem("pv:dataMode");
      if (!pref) {
        setShowModeModal(true);
      } else {
        setMode(pref);
      }
    }
  }, [isAuthenticated, isLoading, currentUser]);

  const handleSelectMode = (selected: "mock" | "real") => {
    setDataModePreference(selected);
    setMode(selected);
    setShowModeModal(false);
    // If switching to mock, clear DB config
    if (selected === "mock") {
      localStorage.removeItem("pv:dbConfig");
    }
  };

  // Restrict navigation until mode is chosen and, for live, DB is configured
  const canNavigate =
    mode === "mock" || (mode === "real" && isDatabaseConfigured());

  // Show auth pages without any layout (after all hooks)
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  return (
    <>
      <Modal open={showModeModal} onOpenChange={() => {}} size="sm">
        <div className="p-6 flex flex-col gap-4 items-center">
          <h2 className="text-xl font-bold mb-2">Choose App Mode</h2>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Select how you want to use the app:
          </p>
          <button
            className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 mb-2"
            onClick={() => handleSelectMode("mock")}
          >
            Dummy Mode (Play with Mock Data)
          </button>
          <button
            className="w-full py-2 px-4 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
            onClick={() => handleSelectMode("real")}
          >
            Live Mode (Connect to Real Database)
          </button>
        </div>
      </Modal>
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar canNavigate={canNavigate} />
        <MainContent canNavigate={canNavigate}>{children}</MainContent>
      </div>
    </>
  );
}

function MainContent({
  children,
  canNavigate,
}: {
  children: React.ReactNode;
  canNavigate?: boolean;
}) {
  const { collapsed } = useSidebar();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to login if not authenticated and not on auth pages
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !pathname.startsWith("/auth")) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Only force DB setup page in live mode if DB is not configured
  React.useEffect(() => {
    // Determine mode from localStorage (sync with layout logic)
    const mode =
      typeof window !== "undefined"
        ? localStorage.getItem("pv:dataMode")
        : null;
    if (
      !isLoading &&
      isAuthenticated &&
      mode === "real" &&
      canNavigate === false
    ) {
      if (pathname !== "/settings/database") {
        router.push("/settings/database");
      }
    }
  }, [isLoading, isAuthenticated, canNavigate, pathname, router]);

  // Show loading while checking auth status
  if (isLoading) {
    return <AppLoader />;
  }

  // Don't render main app until authenticated
  if (!isAuthenticated) {
    return <AppLoader />;
  }

  // If navigation is not allowed, block main content (except DB setup)
  if (canNavigate === false && pathname !== "/settings/database") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300",
        collapsed ? "ml-16" : "ml-60"
      )}
    >
      <Navbar canNavigate={canNavigate} />
      <main className="flex-1 bg-background text-foreground">{children}</main>
      <ScrollToTop />
      {currentUser && <TeamChat currentUser={currentUser.name} />}
    </div>
  );
}
