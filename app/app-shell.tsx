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
import { Modal } from "@/components/ui/Modal";
import { CallRinging } from "@/components/meetings/CallRinging";
import { Database, FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";
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
  const [isNavBlocked, setIsNavBlocked] = React.useState(false);
  const [activeCall, setActiveCall] = React.useState<any>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // 🛡️ COMPREHENSIVE SYNC & REDIRECT FLOW
  React.useEffect(() => {
    if (!isAuthenticated) {
      if (isSyncing) setIsSyncing(false);
      return;
    }

    // 1. SYNC SERVER STATE
    const syncServerState = async () => {
      try {
        const { getDatabaseStatus, markSetupComplete } =
          await import("@/lib/setup");
        const status = await getDatabaseStatus();

        if (status.configured) {
          const currentSetup = localStorage.getItem("pv:setupStatus");
          const profileDone = currentSetup
            ? !!JSON.parse(currentSetup).profileCompleted ||
              !!status.adminExists
            : !!status.adminExists;
          markSetupComplete(true, profileDone, !!status.hasTables);
        } else {
          markSetupComplete(false, false, false);
        }
      } catch (e) {
        console.error("Sync failed:", e);
      } finally {
        setIsSyncing(false);
      }
    };

    if (isSyncing) {
      syncServerState();
      return; // Wait for sync to complete before proceeding
    }

    // 2. DETERMINE MODE & SETUP FLAGS
    if (isAuthenticated && currentUser) {
      const pref = localStorage.getItem("pv:dataMode");

      if (currentUser.isMasterAdmin) {
        // Master Admin gets to choose
        if (!pref && !isDatabaseConfigured()) {
          setDataModePreference("mock");
          setMode("mock");
          localStorage.setItem("pv:onboardingDone", "true");
          setShowModeModal(false);
        } else if (!pref && isDatabaseConfigured()) {
          // DB exists but no choice made, show modal
          setShowModeModal(true);
        } else if (pref) {
          setMode(pref);
          setShowModeModal(false);
          if (pref === "mock") {
            localStorage.setItem("pv:onboardingDone", "true");
          }
        }
      } else {
        // All other roles (Admins, Members, etc.) are FORCED to 'real' mode
        if (pref !== "real") {
          setDataModePreference("real");
          setMode("real");
        } else {
          setMode("real");
        }
        setShowModeModal(false);
      }

      // 3. SECURE REDIRECTS (Only after sync and if mode is explicitly 'real')
      const currentMode = pref || mode;
      const setupComplete = isSetupComplete();
      const onboardingComplete =
        localStorage.getItem("pv:onboardingDone") === "true";

      // Redirect logic for Real mode setup
      if (
        currentMode === "real" &&
        !setupComplete &&
        !onboardingComplete &&
        pathname !== "/onboarding" &&
        pathname !== "/setup/account" &&
        pathname !== "/settings/database" &&
        !pathname.includes("setup=true")
      ) {
        // Only redirect if database is configured (which we checked during sync)
        if (isDatabaseConfigured()) {
          if (hasDatabaseTables()) {
            router.push("/setup/account");
          } else {
            router.push("/onboarding");
          }
        }
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    currentUser,
    pathname,
    router,
    isSyncing,
    mode,
  ]);

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

  // Show auth or meeting pages without any layout (after all hooks)
  if (pathname.startsWith("/auth") || pathname.startsWith("/meetings/")) {
    return <>{children}</>;
  }

  // Show sidebar always, but disable navigation during onboarding until mode is chosen
  const isOnboarding = pathname === "/onboarding";
  const sidebarCanNavigate = isOnboarding ? !!mode : canNavigate;

  return (
    <>
      {/* Mode Selection Modal */}
      <Modal open={showModeModal} onOpenChange={setShowModeModal} size="lg">
        <div className="p-2">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome to ProVision</h2>
            <p className="text-muted-foreground">
              How would you like to build your workspace today?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleSelectMode("mock")}
              className="group p-6 rounded-2xl border-2 border-transparent bg-accent hover:border-primary/50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 font-display">
                Dummy Mode
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore with sample data and no database setup required. Perfect
                for demos.
              </p>
              <div className="flex items-center text-primary font-semibold text-sm">
                Get Started{" "}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </button>

            <button
              onClick={() => handleSelectMode("real")}
              className="group p-6 rounded-2xl border-2 border-transparent bg-accent hover:border-primary/50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 font-display">Live Mode</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your database and start building your real project data
                securely.
              </p>
              <div className="flex items-center text-primary font-semibold text-sm">
                Connect DB{" "}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </div>
      </Modal>

      <MainContent
        canNavigate={canNavigate}
        isSyncing={isSyncing}
        mode={mode}
        onSelectMode={handleSelectMode}
      >
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
  onSelectMode,
}: {
  children: React.ReactNode;
  canNavigate?: boolean;
  isSyncing: boolean;
  mode: string | null;
  onSelectMode: (mode: "mock" | "real") => void;
}) {
  const { collapsed } = useSidebar();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [activeCall, setActiveCall] = React.useState<any>(null);

  // Global Call Signaling Heartbeat
  React.useEffect(() => {
    if (
      !currentUser?.id ||
      !mode ||
      mode === "mock" ||
      pathname.startsWith("/meetings/")
    )
      return;

    const checkCalls = async () => {
      try {
        const { fetchWithCsrf } = await import("@/lib/csrf-client");
        const res = await fetchWithCsrf("/api/presence/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser.id, status: "available" }),
        });
        const json = await res.json();
        if (json.success && json.pendingCalls && json.pendingCalls.length > 0) {
          console.log(`[AppShell] Pending calls found:`, json.pendingCalls);
          if (!activeCall) {
            setActiveCall(json.pendingCalls[0]);
          }
        } else if (
          json.success &&
          (!json.pendingCalls || json.pendingCalls.length === 0)
        ) {
          setActiveCall(null);
        }
      } catch (e) {
        console.error("Call signaling error", e);
      }
    };

    const interval = setInterval(checkCalls, 5000);
    checkCalls();

    return () => clearInterval(interval);
  }, [currentUser?.id, activeCall, pathname, mode]);

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
    !isSyncing &&
    !isLoading &&
    isAuthenticated &&
    currentUser &&
    currentUser.isAdmin &&
    !currentUser.id.includes("admin-global") &&
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
            className="underline hover:text-amber-100 mr-4"
          >
            Complete Setup Now
          </button>
          <button
            onClick={() => onSelectMode("mock")}
            className="text-white/80 hover:text-white text-xs border border-white/20 rounded px-2 py-1 transition-colors"
          >
            Switch to Demo Mode
          </button>
        </div>
      )}

      <Sidebar canNavigate={canNavigate} />
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-60"
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

      {activeCall && (
        <CallRinging invite={activeCall} onClose={() => setActiveCall(null)} />
      )}
    </div>
  );
}
