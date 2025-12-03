"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { ThemePresets } from "@/components/settings/ThemePresets";
import { UserSettingsForm } from "@/components/settings/UserSettingsForm";
import { SetupProfileForm } from "@/components/settings/SetupProfileForm";
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AlertRulesManager } from "@/components/notifications/AlertRulesManager";
import { ProjectWatch } from "@/components/notifications/ProjectWatch";
import { IntegrationSettings } from "@/components/notifications/IntegrationSettings";

type TabKey = "profile" | "user" | "workspace" | "appearance" | "notifications";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("user");
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
          saved === "notifications"
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
              variant={tab === "appearance" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSetTab("appearance")}
              className={cn(tab === "appearance" && "shadow")}
            >
              Appearance
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

      {(tab === "profile" || tab === "user") && (
        isSetupMode ? (
          <SetupProfileForm onComplete={() => {}} />
        ) : (
          <UserSettingsForm />
        )
      )}
      {tab === "workspace" && <WorkspaceSettingsForm />}
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
