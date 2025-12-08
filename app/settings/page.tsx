"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { ThemePresets } from "@/components/settings/ThemePresets";
import { UserSettingsForm } from "@/components/settings/UserSettingsForm";
import { SetupProfileForm } from "@/components/settings/SetupProfileForm";
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm";
import { BlockerCategorySettings } from "@/components/settings/BlockerCategorySettings";
import RiskLevelSettings from "@/components/settings/RiskLevelSettings";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Bell, Shield, Mail } from "lucide-react";
import RolesSettings from "@/components/settings/RolesSettings";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AlertRulesManager } from "@/components/notifications/AlertRulesManager";
import { ProjectWatch } from "@/components/notifications/ProjectWatch";
import { IntegrationSettings } from "@/components/notifications/IntegrationSettings";
import { setDataModePreference, shouldUseDatabaseData } from "@/lib/dataSource";
import { useRouter } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/setup";
import { ChatGroupSettings } from "@/components/settings/ChatGroupSettings";
import {
  saveDatabaseConfig,
  getDatabaseStatus,
  resetConfiguration,
} from "./database/actions";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";

type TabKey =
  | "profile"
  | "user"
  | "workspace"
  | "appearance"
  | "roles"
  | "chat"
  | "email"
  | "notifications"
  | "blockers"
  | "dataSource";

function DataSourceTab() {
  const [dataMode, setDataMode] = useState<"real" | "mock">(() => {
    if (typeof window === "undefined") return "real";
    const val = localStorage.getItem("pv:dataMode");
    return val === "mock" ? "mock" : "real";
  });

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadStatus();

    // Check for dbfail redirect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dbfail") === "1") {
        setDataMode("mock");
        localStorage.setItem("pv:dataMode", "mock");
        setMessage({
          type: "error",
          text: "You must finish the database configuration to use Live mode. Switched back to Dummy mode.",
        });
      }
    }
  }, []);

  async function loadStatus() {
    const result = await getDatabaseStatus();
    setStatus(result);
  }

  const handleDataModeChange = async (mode: "real" | "mock") => {
    setDataMode(mode);
    setMessage(null);

    // Clear session to force re-login
    localStorage.removeItem("pv:currentUser");
    localStorage.removeItem("pv:session");
    localStorage.setItem("pv:dataMode", mode);

    if (mode === "mock") {
      // Seed data if missing
      const { seedLocalData } = await import("@/lib/seedData");
      seedLocalData();
      router.push("/");
    } else {
      await loadStatus();
      router.push("/settings?tab=dataSource");
    }
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);

    const result = await saveDatabaseConfig(formData);

    setLoading(false);
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });

    if (result.success) {
      await loadStatus();
      // Optional: Redirect to onboarding if this was part of setup?
      // For settings page, we stay here but refresh status.
    }
  }

  async function handleReset() {
    if (
      !confirm(
        "Reset to environment variables? This will clear custom database credentials."
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await resetConfiguration();
    setLoading(false);
    setMessage({
      type: "success",
      text: result.message,
    });
    await loadStatus();
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Hide left navbar during mode selection */}
      <style>{`.sidebar, .Navbar { display: none !important; }`}</style>

      <div>
        <h2 className="text-lg font-semibold mb-2">Data Source Mode</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Choose between using real database data or dummy demo data.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={dataMode === "real" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDataModeChange("real")}
          >
            Use Real Data (Live)
          </Button>
          <Button
            variant={dataMode === "mock" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDataModeChange("mock")}
          >
            Use Dummy Data (Demo)
          </Button>
        </div>

        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-4"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {dataMode === "mock" && (
          <div className="mt-3 text-xs text-muted-foreground p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="mb-2">
              <strong>Demo Mode Active</strong>
            </p>
            <p>
              Fake Admin: <span className="font-mono">admin@provision.com</span>{" "}
              / <span className="font-mono">password123578951</span>
            </p>
          </div>
        )}

        {dataMode === "real" && (
          <div className="space-y-6 mt-6">
            {/* Status Card */}
            {status && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Configuration Status
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Source:</strong>{" "}
                    {status.currentSource === "database"
                      ? "🗄️ Database (Custom)"
                      : "🌍 Environment Variables"}
                  </p>
                  <p>
                    <strong>Environment Variables:</strong>{" "}
                    {status.hasEnvironmentVars ? "✅ Configured" : "❌ Missing"}
                  </p>
                  <p>
                    <strong>Custom Database Config:</strong>{" "}
                    {status.hasDatabaseConfig ? "✅ Configured" : "❌ Not Set"}
                  </p>
                </div>

                {status.recommendations.length > 0 && (
                  <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                    <AlertDescription>
                      {status.recommendations.map((rec: string, i: number) => (
                        <div key={i}>{rec}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            )}

            {/* Configuration Form */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Custom Database Credentials
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure custom database credentials that will override
                environment variables.
              </p>

              <form action={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Postgres URL
                  </label>
                  <Input
                    name="postgresUrl"
                    type="text"
                    placeholder="postgres://user:pass@host:5432/dbname"
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Blob Storage Token
                  </label>
                  <Input
                    name="blobToken"
                    type="text"
                    placeholder="vercel_blob_rw_..."
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button type="submit" disabled={loading}>
                    {loading
                      ? "Testing & Saving..."
                      : "Test & Save Configuration"}
                  </Button>

                  {status?.hasDatabaseConfig && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset to Env Vars
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("user");
  const [dataMode, setDataMode] = useState<"real" | "mock">(() => {
    if (typeof window === "undefined") return "real";
    const val = localStorage.getItem("pv:dataMode");
    return val === "mock" ? "mock" : "real";
  });
  const isSetupMode = searchParams.get("setup") === "true";

  // Check URL params first, then restore last selected main tab on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "profile") {
      setTab("profile");
    } else {
      try {
        const saved = localStorage.getItem("pv:settingsTab");
        if (
          saved === "user" ||
          saved === "workspace" ||
          saved === "appearance" ||
          saved === "notifications" ||
          saved === "dataSource"
        ) {
          setTab(saved as TabKey);
        }
      } catch {}
    }
  }, [searchParams]);

  const handleSetTab = (next: TabKey) => {
    setTab(next);
    try {
      localStorage.setItem("pv:settingsTab", next);
    } catch {}
  };

  const handleDataModeChange = (mode: "real" | "mock") => {
    setDataMode(mode);
    try {
      setDataModePreference(mode);
    } catch {}
  };

  return (
    <section className="p-4 md:p-8 max-w-5xl flex flex-col gap-8">
      {/* Hide all navigation UI if in setup mode */}
      {isSetupMode && (
        <style>{`.sidebar, .Navbar, .nav, .navigation, .menu, .drawer, .topbar, .appbar, .AppBar, .app-bar, .header, .Header, .footer, .Footer { display: none !important; }`}</style>
      )}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {isSetupMode ? "Complete Your Profile" : "Settings"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isSetupMode
            ? "Set up your admin account to continue. All fields are required."
            : "Manage your profile and workspace configuration."}
        </p>
      </div>
      {/* Hide navigation tabs if in setup mode */}
      {!isSetupMode && (
        <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
          <Button
            variant={
              tab === "profile" || tab === "user" ? "primary" : "outline"
            }
            size="sm"
            onClick={() => handleSetTab("profile")}
            className={cn((tab === "profile" || tab === "user") && "shadow")}
          >
            Profile
          </Button>
          <Button
            variant={tab === "workspace" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("workspace")}
            className={cn(tab === "workspace" && "shadow")}
          >
            Workspace / Agency
          </Button>
          <Button
            variant={tab === "dataSource" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("dataSource")}
            className={cn(tab === "dataSource" && "shadow")}
          >
            Data Source
          </Button>
          <Button
            variant={tab === "appearance" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("appearance")}
            className={cn(tab === "appearance" && "shadow")}
          >
            Appearance
          </Button>
          <Button
            variant={tab === "roles" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("roles")}
            className={cn(tab === "roles" && "shadow")}
          >
            Roles
          </Button>
          <Button
            variant={tab === "blockers" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("blockers")}
            className={cn(tab === "blockers" && "shadow")}
          >
            Blockers
          </Button>
          <Button
            variant={tab === "chat" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("chat")}
            className={cn(tab === "chat" && "shadow")}
          >
            Chat
          </Button>
          <Button
            variant={tab === "email" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("email")}
            className={cn(tab === "email" && "shadow")}
          >
            Email
          </Button>
          <Button
            variant={tab === "notifications" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("notifications")}
            className={cn(tab === "notifications" && "shadow")}
          >
            Notifications
          </Button>
        </div>
      )}
      {tab === "roles" && !isSetupMode && (
        <div className="max-w-3xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Team Roles</h2>
            <p className="text-sm text-muted-foreground">
              Add, remove, or modify roles available to your teams. Only admins
              can make changes.
            </p>
          </div>
          <RolesSettings />
        </div>
      )}

      {(tab === "profile" || tab === "user") &&
        (isSetupMode ? (
          <SetupProfileForm onComplete={() => {}} />
        ) : (
          <UserSettingsForm />
        ))}
      {tab === "workspace" && !isSetupMode && <WorkspaceSettingsForm />}
      {tab === "dataSource" && !isSetupMode && <DataSourceTab />}

      {tab === "appearance" && !isSetupMode && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Theme Mode</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Toggle light/dark mode.
            </p>
            <ThemeSwitcher />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Color Presets</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Pick a primary color. This updates the app accent.
            </p>
            <ThemePresets />
          </div>
        </div>
      )}
      {tab === "blockers" && !isSetupMode && (
        <div className="max-w-3xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Blocker Categories</h2>
            <p className="text-sm text-muted-foreground">
              Define the categories used when reporting blockers. Categories
              help route issues to the right owner group and set expectations
              with target SLA days. You can edit labels, owners, SLAs, icons, or
              add new categories. Changes are stored locally and work in
              production without a backend.
            </p>
          </div>
          <BlockerCategorySettings />
          <div className="space-y-2 pt-4">
            <h2 className="text-xl font-bold">Risk Levels</h2>
            <p className="text-sm text-muted-foreground">
              Configure the risk levels used in filters and badges. You can add,
              rename, recolor, and reorder levels.
            </p>
          </div>
          <RiskLevelSettings />
        </div>
      )}
      {tab === "email" && !isSetupMode && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Email Configuration</h2>
              <p className="text-sm text-muted-foreground">
                Configure email provider for sending notifications
              </p>
            </div>
          </div>
          <IntegrationSettings mode="email" />
        </div>
      )}
      {tab === "chat" && !isSetupMode && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Chat Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage chat groups and team conversations
              </p>
            </div>
          </div>
          <ChatGroupSettings />
        </div>
      )}
      {tab === "notifications" && !isSetupMode && <NotificationsSettingsTabs />}
    </section>
  );
}

// Inline wrapper to keep the existing notifications design with its own subtabs

function NotificationsSettingsTabs() {
  const [activeTab, setActiveTab] = useState<
    "notifications" | "rules" | "watch" | "integrations"
  >("notifications");

  // Restore last selected notifications sub-tab
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pv:notificationsSubTab");
      if (
        saved === "notifications" ||
        saved === "rules" ||
        saved === "watch" ||
        saved === "integrations"
      ) {
        setActiveTab(saved as any);
      }
    } catch {}
  }, []);

  const handleSetActive = (
    next: "notifications" | "rules" | "watch" | "integrations"
  ) => {
    setActiveTab(next);
    try {
      localStorage.setItem("pv:notificationsSubTab", next);
    } catch {}
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Notifications & Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Manage notifications, alerts, and integrations
          </p>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => handleSetActive("notifications")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => handleSetActive("rules")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "rules"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Alert Rules
          </button>
          <button
            onClick={() => handleSetActive("watch")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "watch"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Project Watch
          </button>
          <button
            onClick={() => handleSetActive("integrations")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "integrations"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Integrations
          </button>
        </div>
      </div>

      {activeTab === "notifications" && <NotificationCenter />}
      {activeTab === "rules" && <AlertRulesManager />}
      {activeTab === "watch" && <ProjectWatch />}
      {activeTab === "integrations" && <IntegrationSettings mode="slack" />}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <section className="p-4 md:p-8 max-w-5xl">
          <div className="text-center">Loading settings...</div>
        </section>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
