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
import { Bell, Shield } from "lucide-react";
import RolesSettings from "@/components/settings/RolesSettings";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AlertRulesManager } from "@/components/notifications/AlertRulesManager";
import { ProjectWatch } from "@/components/notifications/ProjectWatch";
import { IntegrationSettings } from "@/components/notifications/IntegrationSettings";
import { setDataModePreference, shouldUseDatabaseData } from "@/lib/dataSource";
import { useRouter } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/setup";

type TabKey =
  | "profile"
  | "user"
  | "workspace"
  | "appearance"
  | "roles"
  | "notifications"
  | "blockers"
  | "dataSource";

function DataSourceTab() {
  const [dataMode, setDataMode] = useState<"real" | "mock">(() => {
    if (typeof window === "undefined") return "real";
    const val = localStorage.getItem("pv:dataMode");
    return val === "mock" ? "mock" : "real";
  });
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // License activation state
  const [license, setLicense] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseValid, setLicenseValid] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const handleDataModeChange = (mode: "real" | "mock") => {
    setDataMode(mode);
    setError("");
    if (mode === "real") {
      setLicenseValid(false);
      setLicense("");
      setLicenseError(null);
    }
  };

  const handleCheckLicense = async () => {
    setLicenseLoading(true);
    setLicenseError(null);
    try {
      const resp = await fetch("/api/check-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial: license }),
      });
      const data = await resp.json();
      if (data.success) {
        setLicenseValid(true);
      } else {
        setLicenseError(data.error || "Invalid serial number");
        setLicenseValid(false);
      }
    } catch (err) {
      setLicenseError("Network or server error");
      setLicenseValid(false);
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    // Clear session to force re-login with appropriate credentials/mode
    localStorage.removeItem("pv:currentUser");
    localStorage.removeItem("pv:session");

    localStorage.setItem("pv:dataMode", dataMode);

    // Navigate based on selected mode
    if (dataMode === "real") {
      router.push("/settings/database");
    } else {
      router.push("/");
    }

    setSaving(false);
  };

  // On mount, check if redirected back from DB config and DB is not configured
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dbfail") === "1") {
        setDataMode("mock");
        localStorage.setItem("pv:dataMode", "mock");
        setError(
          "You must finish the database configuration to use Live mode. Switched back to Dummy mode."
        );
      }
    }
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Hide left navbar during mode selection, license, and db config */}
      <style>{`.sidebar, .Navbar { display: none !important; }`}</style>
      <div>
        <h2 className="text-lg font-semibold mb-2">Data Source Mode</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Choose between using real database data or dummy demo data. When dummy
          data is enabled, a fake admin login is available.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={dataMode === "real" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDataModeChange("real")}
          >
            Use Real Data
          </Button>
          <Button
            variant={dataMode === "mock" ? "primary" : "outline"}
            size="sm"
            onClick={async () => {
              handleDataModeChange("mock");
              // Seed data if missing
              const { seedLocalData } = await import("@/lib/seedData");
              seedLocalData();
            }}
          >
            Use Dummy Data
          </Button>
        </div>
        {dataMode === "mock" && (
          <div className="mt-3 text-xs text-muted-foreground">
            Fake Admin: <span className="font-mono">admin@provision.com</span> /{" "}
            <span className="font-mono">password123578951</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => {
                setDataMode("real");
                setLicenseValid(false);
                setLicense("");
                setLicenseError(null);
                // Clear session to force re-login
                localStorage.removeItem("pv:currentUser");
                localStorage.removeItem("pv:session");
                // Persist mode change BEFORE navigation
                localStorage.setItem("pv:dataMode", "real");
                router.push("/settings/database");
              }}
            >
              Switch to Live Mode
            </Button>
          </div>
        )}
        {error && (
          <div className="mt-3 text-xs text-red-500 font-semibold">{error}</div>
        )}
        <div className="mt-6">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save & Continue"}
          </Button>
          {dataMode === "real" && (
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={async () => {
                setDataMode("mock");
                setLicenseValid(false);
                setLicense("");
                setLicenseError(null);
                // Clear session to force re-login
                localStorage.removeItem("pv:currentUser");
                localStorage.removeItem("pv:session");
                // Persist mode change BEFORE navigation
                localStorage.setItem("pv:dataMode", "mock");

                // Seed data for rich experience
                const { seedLocalData } = await import("@/lib/seedData");
                seedLocalData();

                router.push("/settings?tab=dataSource");
              }}
            >
              Revert to Dummy Mode
            </Button>
          )}
        </div>
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
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        <Button
          variant={tab === "profile" || tab === "user" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("profile")}
          className={cn((tab === "profile" || tab === "user") && "shadow")}
        >
          Profile
        </Button>
        {!isSetupMode && (
          <>
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
              variant={tab === "notifications" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSetTab("notifications")}
              className={cn(tab === "notifications" && "shadow")}
            >
              Notifications
            </Button>
          </>
        )}
      </div>
      {tab === "roles" && (
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
      {tab === "workspace" && <WorkspaceSettingsForm />}
      {tab === "dataSource" && <DataSourceTab />}

      {tab === "appearance" && (
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
      {tab === "blockers" && (
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
      {tab === "notifications" && <NotificationsSettingsTabs />}
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
      {activeTab === "integrations" && <IntegrationSettings />}
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
