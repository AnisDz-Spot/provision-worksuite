"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useAuth } from "@/components/auth/AuthContext";
import { TeamChat } from "@/components/team/TeamChat";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { setDataModePreference } from "@/lib/dataSource";
import { AppLoader } from "@/components/ui/AppLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  isDatabaseConfigured,
  isSetupComplete,
  hasDatabaseTables,
} from "@/lib/setup";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = React.useState(false);
  const [mode, setMode] = React.useState<string | null>(null);
  const [showModeModal, setShowModeModal] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(true);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-detect demo mode and set flags FIRST, before any redirects
  React.useEffect(() => {
    // 🛡️ CRITICAL: Wait for sync before making automatic decisions
    if (isSyncing) return;

    if (!isLoading && isAuthenticated && currentUser?.isAdmin) {
      const pref = localStorage.getItem("pv:dataMode");
      const onboardingDone = localStorage.getItem("pv:onboardingDone");

      // If no mode set yet and no database, auto-set to mock and skip onboarding
      if (!pref && !isDatabaseConfigured()) {
        console.log(
          "[AppShell] No database found after sync, auto-setting to mock"
        );
        setDataModePreference("mock");
        setMode("mock"); // 🔑 Update local state too
        localStorage.setItem("pv:onboardingDone", "true");
      }

      // Now check if redirect needed (after setting flags above)
      const mode = localStorage.getItem("pv:dataMode");
      const onboardingComplete = localStorage.getItem("pv:onboardingDone");

      if (
        pathname !== "/onboarding" &&
        pathname !== "/setup/account" && // Don't redirect if already on setup page
        !onboardingComplete &&
        mode !== "mock" &&
        isDatabaseConfigured() &&
        (!pathname.includes("setup=true") || !hasDatabaseTables()) // 🔑 REQUIRE tables for setup=true
      ) {
        // If tables exist but onboarding not done, go to setup account
        if (hasDatabaseTables()) {
          router.push("/setup/account");
        } else {
          router.push("/onboarding");
        }
      }
    }
  }, [isLoading, isAuthenticated, currentUser, pathname, router, isSyncing]);

  // Sync DB status from server to prevent redirect loop in Live mode

  React.useEffect(() => {
    if (isAuthenticated) {
      import("@/lib/setup").then(({ getDatabaseStatus, markSetupComplete }) => {
        getDatabaseStatus()
          .then((status) => {
            if (status.configured) {
              // Server says DB is configured, so update our local state
              const currentSetup = localStorage.getItem("pv:setupStatus");
              const profileDone = currentSetup
                ? !!JSON.parse(currentSetup).profileCompleted ||
                  !!status.adminExists
                : !!status.adminExists;
              markSetupComplete(true, profileDone, !!status.hasTables);

              // 🔑 SYNC LOCAL STATE: If we found a DB, ensure we are in a valid mode
              const pref = localStorage.getItem("pv:dataMode");
              if (!pref || pref === "mock") {
                // If no preference OR it was automatically set to "mock" because DB wasn't ready,
                // we should stick with "real" now that we KNOW there's a DB.
                setDataModePreference("real");
                setMode("real");
              } else if (pref) {
                setMode(pref);
              }

              // 🛡️ CRITICAL REDIRECTION: If configured but has no tables, force to onboarding
              if (
                !status.hasTables &&
                pathname !== "/onboarding" &&
                pathname !== "/settings/database"
              ) {
                router.push("/onboarding");
              }
            } else {
              // Server says DB is NOT configured, ensure our local state reflects this
              markSetupComplete(false, false, false);
            }
            setIsSyncing(false);
          })
          .catch(() => {
            // If API fails, assume no database
            markSetupComplete(false, false);
            setIsSyncing(false);
          });
      });
    } else {
      setIsSyncing(false);
    }

    if (!isLoading && isAuthenticated && currentUser?.isAdmin) {
      const pref = localStorage.getItem("pv:dataMode");

      // Just handle the modal display here, mode is already set in first useEffect
      if (!pref && isDatabaseConfigured()) {
        // Database exists and mode not chosen, show modal
        setShowModeModal(true);
      } else {
        if (pref) {
          setMode(pref);
        }
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
  // Restrict navigation until mode is chosen and, for live, DB is configured
  const canNavigate =
    mode === "mock" ||
    (mode === "real" && isDatabaseConfigured()) ||
    currentUser?.email === "admin@provision.com";

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
      <MainContent canNavigate={canNavigate} isSyncing={isSyncing} mode={mode}>
        {children}
      </MainContent>
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
      canNavigate === false &&
      !isSetupComplete()
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
    return <PageLoader />;
  }

  // Don't render main app until authenticated
  if (!isAuthenticated) {
    return <AppLoader />;
  }

  // If navigation is NOT allowed (e.g. forced onboarding), still show the sidebar/navbar
  // but block the inner content.
  const isNavBlocked =
    canNavigate === false &&
    pathname !== "/settings/database" &&
    pathname !== "/onboarding" &&
    pathname !== "/setup/account";

  const showSetupBanner =
    !isLoading &&
    isAuthenticated &&
    currentUser?.isAdmin &&
    mode === "real" &&
    !isSetupComplete() &&
    pathname !== "/onboarding" &&
    pathname !== "/setup/account" &&
    !pathname.includes("setup=true") &&
    pathname !== "/settings/database";

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Persistent Setup Banner */}
      {showSetupBanner && (
        <div className="bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
          <span>⚠️ Your account setup is incomplete.</span>
          <button
            onClick={() => router.push("/setup/account")}
            className="underline hover:text-amber-100"
          >
            Complete Setup Now
          </button>
        </div>
      )}

      <Sidebar canNavigate={canNavigate} />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-60"
        }`}
      >
        <Navbar canNavigate={canNavigate} />
        <main className="flex-1 bg-background text-foreground relative">
          {isSyncing || isNavBlocked ? <PageLoader /> : null}
          {children}
        </main>
        <ScrollToTop />
        {currentUser && pathname !== "/onboarding" && mode === "real" && (
          <TeamChat currentUser={currentUser.id} />
        )}
      </div>
    </div>
  );
}
