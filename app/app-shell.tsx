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
import { CallProvider } from "@/components/meetings/CallContext";
import { Database, FlaskConical, ArrowRight, ShieldCheck } from "lucide-react";
import {
  isDatabaseConfigured,
  isSetupComplete,
  hasDatabaseTables,
} from "@/lib/setup";
import { hasValidLicense, clearLicense } from "@/lib/license";
import { isGlobalAdmin } from "@/lib/auth-utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [isClient, setIsClient] = React.useState(false);
  const [mode, setMode] = React.useState<string | null>(null);
  const [showModeModal, setShowModeModal] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(true);
  const [isNavBlocked, setIsNavBlocked] = React.useState(false);
  const [serverLicenseValid, setServerLicenseValid] = React.useState(false);
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
        const status = (await getDatabaseStatus()) as any;

        if (status.failed) {
          console.warn(
            "[AppShell] System check unreachable. Retaining local state."
          );
          return;
        }

        if (status.configured) {
          const currentSetup = localStorage.getItem("pv:setupStatus");
          const profileDone = currentSetup
            ? !!JSON.parse(currentSetup).profileCompleted ||
              !!status.adminExists
            : !!status.adminExists;

          // Authenticated users who reached this shell are inherently setup-competent
          const finalProfileDone =
            profileDone || (isAuthenticated && !!currentUser?.isAdmin);

          markSetupComplete(true, finalProfileDone, !!status.hasTables);
          setServerLicenseValid(status.licenseValid);
        } else {
          markSetupComplete(false, false, false);
          setServerLicenseValid(false);
        }
      } catch (e) {
        console.error("Sync failed:", e);
        // Do NOT reset setup complete on transient errors to avoid flickering banner
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
      const isMasterAdmin = currentUser.isMasterAdmin;
      const isGlobal = isGlobalAdmin(currentUser);
      const isMaster = isMasterAdmin || isGlobal;
      const tablesExist = hasDatabaseTables(); // Synced from server
      const localLicenseValid = hasValidLicense();
      const validLicense = localLicenseValid || serverLicenseValid;

      // REQUIREMENT 1: No DB Checks or No Tables
      // If no tables exist (implies DB not configured or empty), ONLY Global Admin can access in Mock Mode.
      if (!tablesExist) {
        if (isGlobal) {
          console.log(
            "[AppShell] No tables/DB found. Enforcing Mock Mode for Global Admin."
          );
          if (pref !== "mock") {
            setDataModePreference("mock");
            localStorage.setItem("pv:onboardingDone", "true");
          }
          if (mode !== "mock") {
            setMode("mock");
          }
          setShowModeModal(false);
          setIsSyncing(false);
          return;
        } else {
          console.warn(
            "[AppShell] No tables/DB found. Standard users not allowed. Logging out."
          );
          // Redirect to logout to ensure clean state
          window.location.href = "/api/auth/logout";
          return;
        }
      }

      // REQUIREMENT 2: Master Admin + License
      // Once Master Admin exists (implies tables exist) + Valid License => Force LIVE Mode
      if (isMasterAdmin && validLicense) {
        if (pref !== "real") {
          console.log(
            "[AppShell] Licensed Master Admin found. Enforcing Live Mode."
          );
          setDataModePreference("real");
        }
        if (mode !== "real") {
          setMode("real");
        }
        setShowModeModal(false);
        // Continue to setup checks...
      } else {
        // Standard Mode Handling (if not enforced above)
        if (!mode) {
          if (pref) {
            setMode(pref);
            if (pref === "mock") setShowModeModal(false);
          } else {
            // New user, no preference
            if (isMaster) {
              // Master can choose
              // But if we are here (tables exist), default to Real unless explicitly mock?
              // Let logic fall through to modal or default
              if (isDatabaseConfigured()) setShowModeModal(true);
              else {
                setMode("mock");
                setDataModePreference("mock");
              }
            } else {
              // Standard users forced to Real
              setMode("real");
              setDataModePreference("real");
            }
          }
        }
      }

      // Define function to handle setup flow (used for License/Setup redirects below)
      const handleMasterAdminFlow = () => {
        // This function is less relevant with strict enforcement but kept for setup checks
        const setupDone = isDatabaseConfigured() && isSetupComplete();
        if (setupDone) setShowModeModal(false);
      };

      // Non-master admin: FORCED to 'real' mode (redundant safeguard)
      if (!isMaster) {
        if (pref !== "real") {
          setDataModePreference("real");
          setMode("real");
        } else if (mode !== "real") {
          setMode("real");
        }
        setShowModeModal(false);
      }

      // 3. SECURE REDIRECTS (Only after sync and if mode is explicitly 'real')
      const currentMode = pref || mode;
      // Trust auth state: if we are logged in as Master Admin, setup MUST be complete enough to exist.
      const setupComplete = isSetupComplete() || (isAuthenticated && isMaster);
      const onboardingComplete =
        localStorage.getItem("pv:onboardingDone") === "true";
      const hasLicense = hasValidLicense() || serverLicenseValid;

      // IF in REAL mode but NO license, we must force them to activate or fallback to mock
      if (currentMode === "real" && !hasLicense) {
        // FAILSAFE: If Global Admin and No Tables found (despite being here), Force Mock and Exit
        if (isGlobal && !tablesExist) {
          console.log(
            "[AppShell] Global Admin caught in Real Mode without Tables. Switching to Mock."
          );
          setMode("mock");
          setDataModePreference("mock");
          return;
        }

        // If they are not on the license page, send them there or force mock mode
        if (pathname !== "/license-activation" && pathname !== "/onboarding") {
          console.log(
            "[AppShell] Real mode active without license, forcing license activation link"
          );
          // 🛡️ SECURITY: Only Master Admin can fallback to mock mode or perform setup
          // Standard users (Admins, Members) should stay in REAL mode.
          // Since license validation is client-side (localStorage), regular users won't have it.
          // We assume if the system is live (isDatabaseConfigured), it is licensed.
          if (isMaster) {
            // USER REQUEST: Deactivate dummy mode.
            // setMode("mock"); // DISABLED
            // setDataModePreference("mock"); // DISABLED
            // localStorage.removeItem("pv:dbConfig");
            router.replace("/license-activation");
            return;
          } else {
            // Non-master users: Do NOT redirect to license page.
            // Just log and let them fall through to profile setup or main app.
            console.log(
              "[AppShell] Non-master user, skipping license check (client-side only)"
            );
          }
          // Do NOT return for non-master users, let flow continue
        } else if (pathname !== "/license-activation") {
          // If they managed to get to onboarding somehow, send them to license
          router.replace("/license-activation");
        }
        return;
      }

      // IF in REAL mode but setup is NOT finished, check for abandonment
      if (currentMode === "real" && !setupComplete && hasLicense) {
        const isAtSetup =
          pathname === "/onboarding" ||
          pathname === "/setup/account" ||
          pathname === "/license-activation" ||
          pathname === "/settings/database" ||
          pathname.includes("setup=true");

        if (!isAtSetup) {
          console.log("[AppShell] Setup or profile missing for real mode");
          if (isMaster) {
            console.log(
              "[AppShell] Master Admin: resetting to mock mode (DISABLED BY USER REQUEST)"
            );
            // setDataModePreference("mock");
            // setMode("mock");
            // clearLicense();
          } else {
            // Standard user on a configured DB but with no profile yet
            console.log("[AppShell] Redirecting to profile setup");
            router.replace("/setup/account");
          }
          return;
        }
      }

      // Redirect logic for Real mode setup
      if (
        currentMode === "real" &&
        !setupComplete &&
        !onboardingComplete &&
        pathname !== "/onboarding" &&
        pathname !== "/setup/account" &&
        pathname !== "/settings/database" &&
        pathname !== "/license-activation" &&
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
        <CallProvider>{children}</CallProvider>
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
  const activeCallRef = React.useRef<any>(null);

  React.useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Global Call Signaling Heartbeat
  React.useEffect(() => {
    if (
      !currentUser?.id ||
      !mode ||
      mode === "mock" ||
      pathname.startsWith("/meetings/")
    )
      return;

    // Global Call Signaling Heartbeat
    let timeoutId: NodeJS.Timeout;

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
          if (!activeCallRef.current) {
            setActiveCall(json.pendingCalls[0]);
          }
        } else if (
          json.success &&
          (!json.pendingCalls || json.pendingCalls.length === 0)
        ) {
          if (activeCallRef.current) {
            setActiveCall(null);
          }
        }
      } catch (e) {
        // Silent fail
      } finally {
        timeoutId = setTimeout(checkCalls, 5000);
      }
    };

    checkCalls();

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, pathname, mode]);

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
        className={`flex flex-col min-h-screen transition-all duration-300 ml-0 ${
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
