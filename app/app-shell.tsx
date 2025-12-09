"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useAuth } from "@/components/auth/AuthContext";
import { TeamChat } from "@/components/team/TeamChat";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { AppLoader } from "@/components/ui/AppLoader";
import { cn } from "@/lib/utils";
import { setDataModePreference } from "@/lib/dataSource";
import { isDatabaseConfigured } from "@/lib/setup";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = React.useState<string | null>(null);
  const [showModeModal, setShowModeModal] = React.useState(false);

  // Redirect global admin to onboarding on first login or when onboarding is not done and mode is not mock
  React.useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser?.isAdmin) {
      const onboardingDone = localStorage.getItem("pv:onboardingDone");
      const mode = localStorage.getItem("pv:dataMode");
      if (pathname !== "/onboarding" && !onboardingDone && mode !== "mock") {
        router.push("/onboarding");
      }
    }
  }, [isLoading, isAuthenticated, currentUser, pathname, router]);

  // Sync DB status from server to prevent redirect loop in Live mode
  const [isSyncing, setIsSyncing] = React.useState(true);

  React.useEffect(() => {
    if (isAuthenticated) {
      import("@/lib/setup").then(({ getDatabaseStatus, markSetupComplete }) => {
        getDatabaseStatus()
          .then((status) => {
            if (status.configured) {
              // Server says DB is configured, so update our local state
              const currentSetup = localStorage.getItem("pv:setupStatus");
              const profileDone = currentSetup
                ? JSON.parse(currentSetup).profileCompleted
                : true;
              markSetupComplete(true, profileDone);
            }
            setIsSyncing(false);
          })
          .catch(() => setIsSyncing(false));
      });
    } else {
      setIsSyncing(false);
    }

    if (!isLoading && isAuthenticated && currentUser?.isAdmin) {
      const pref = localStorage.getItem("pv:dataMode");
      if (!pref) {
        setShowModeModal(true);
      } else {
        setMode(pref);
        setShowModeModal(false);
      }
    }
  }, [isAuthenticated, isLoading, currentUser]);

  const handleSelectMode = (selected: "mock" | "real") => {
    setDataModePreference(selected);
    setMode(selected);
    setShowModeModal(false);
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

  // Show sidebar always, but disable navigation during onboarding until mode is chosen
  const isOnboarding = pathname === "/onboarding";
  const sidebarCanNavigate = isOnboarding ? !!mode : canNavigate;

  return (
    <>
      {/* Legacy mode selection modal removed. Only new design remains. */}
      <div className="flex min-h-screen w-full overflow-hidden">
        <Sidebar canNavigate={sidebarCanNavigate} />
        <MainContent
          canNavigate={canNavigate}
          isSyncing={isSyncing}
          mode={mode}
        >
          {children}
        </MainContent>
      </div>
    </>
  );
}

function MainContent({
  children,
  canNavigate,
  isSyncing,
  mode,
}: {
  children: React.ReactNode;
  canNavigate?: boolean;
  isSyncing: boolean;
  mode: string | null;
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
    // If checking sync, do NOT redirect yet
    if (isSyncing) return;

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
  }, [
    isLoading,
    isAuthenticated,
    canNavigate,
    pathname,
    router,
    isSyncing,
    mode,
  ]);

  // Show loading while checking auth status
  if (isLoading) {
    return <AppLoader />;
  }

  // Don't render main app until authenticated
  if (!isAuthenticated) {
    return <AppLoader />;
  }

  // If navigation is not allowed, block main content (except DB setup and onboarding)
  if (
    canNavigate === false &&
    pathname !== "/settings/database" &&
    pathname !== "/onboarding"
  ) {
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
