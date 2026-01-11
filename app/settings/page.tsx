"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Bell, Shield, Mail, HelpCircle, Video, Bot } from "lucide-react";

// Components
import { UserSettingsForm } from "@/components/settings/UserSettingsForm";
import { WorkspaceSettingsForm } from "@/components/settings/WorkspaceSettingsForm";
import { BlockerCategorySettings } from "@/components/settings/BlockerCategorySettings";
import RiskLevelSettings from "@/components/settings/RiskLevelSettings";
import RolesSettings from "@/components/settings/RolesSettings";
import { AISettings } from "@/components/settings/AISettings";
import { ChatGroupSettings } from "@/components/settings/ChatGroupSettings";
import { ZegoSettingsForm } from "@/components/settings/ZegoSettingsForm";
import { SupportTab } from "@/components/settings/SupportTab";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { EmailSettings } from "@/components/settings/EmailSettings";
import { IntegrationSettings } from "@/components/notifications/IntegrationSettings";

// New Modular Components
import { DataSourceSettings } from "@/components/settings/DataSourceSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";

// Utils
import { setDataModePreference } from "@/lib/dataSource";
import { hasDatabaseTables } from "@/lib/setup";

type TabKey =
  | "profile"
  | "user"
  | "workspace"
  | "appearance"
  | "security"
  | "roles"
  | "chat"
  | "email"
  | "notifications"
  | "blockers"
  | "dataSource"
  | "video"
  | "support"
  | "ai";

function SettingsContent() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("user");

  const [dataMode, setDataMode] = useState<"real" | "mock" | null>(() => {
    if (typeof window === "undefined") return null;
    const val = localStorage.getItem("pv:dataMode");
    return val === "mock" || val === "real" ? val : null;
  });

  const isSetupMode = searchParams.get("setup") === "true";

  useEffect(() => {
    const checkSetup = async () => {
      if (dataMode === "real") {
        if (typeof window !== "undefined") {
          if (!hasDatabaseTables()) {
            router.push("/settings?tab=dataSource");
          }
        }
      }
    };
    checkSetup();

    const urlTab = searchParams.get("tab");
    if (urlTab === "profile") {
      setTab("profile");
    } else {
      try {
        const saved = localStorage.getItem("pv:settingsTab");
        const validTabs: TabKey[] = [
          "profile",
          "user",
          "workspace",
          "appearance",
          "security",
          "roles",
          "chat",
          "email",
          "notifications",
          "blockers",
          "dataSource",
          "video",
          "support",
          "ai",
        ];
        if (saved && validTabs.includes(saved as TabKey)) {
          setTab(saved as TabKey);
        }
      } catch {}
    }
  }, [searchParams, dataMode, isSetupMode, router]);

  const handleSetTab = (next: TabKey) => {
    setTab(next);
    try {
      localStorage.setItem("pv:settingsTab", next);
    } catch {}
  };

  return (
    <section className="p-4 md:p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and workspace configuration.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        <Button
          variant={tab === "profile" || tab === "user" ? "primary" : "outline"}
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
          variant={tab === "security" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("security")}
          className={cn(tab === "security" && "shadow")}
        >
          <Shield className="w-4 h-4 mr-2" />
          Security
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
          variant={tab === "video" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("video")}
          className={cn(tab === "video" && "shadow")}
        >
          <Video className="w-4 h-4 mr-2" />
          Video
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
        <Button
          variant={tab === "support" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("support")}
          className={cn(tab === "support" && "shadow")}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Support
        </Button>
        {isAdmin && (
          <Button
            variant={tab === "ai" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("ai")}
            className={cn(tab === "ai" && "shadow")}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI & Agents
          </Button>
        )}
      </div>

      <div className="tab-content pt-4">
        {(tab === "profile" || tab === "user") && <UserSettingsForm />}

        {tab === "workspace" && !isSetupMode && <WorkspaceSettingsForm />}

        {tab === "dataSource" && !isSetupMode && <DataSourceSettings />}

        {tab === "appearance" && !isSetupMode && <AppearanceSettings />}

        {tab === "security" && !isSetupMode && <SecuritySettings />}

        {tab === "ai" && !isSetupMode && <AISettings />}

        {tab === "roles" && !isSetupMode && (
          <div className="max-w-3xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Team Roles</h2>
              <p className="text-sm text-muted-foreground">
                Add, remove, or modify roles available to your teams. Only
                admins can make changes.
              </p>
            </div>
            <RolesSettings />
          </div>
        )}

        {tab === "blockers" && !isSetupMode && (
          <div className="max-w-3xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Blocker Categories</h2>
              <p className="text-sm text-muted-foreground">
                Define the categories used when reporting blockers.
              </p>
            </div>
            <BlockerCategorySettings />
            <div className="space-y-2 pt-4">
              <h2 className="text-xl font-bold">Risk Levels</h2>
              <p className="text-sm text-muted-foreground">
                Configure the risk levels used in filters and badges.
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
                  Configure email provider for sending notifications.
                </p>
              </div>
            </div>
            <IntegrationSettings mode="email" />
            <EmailSettings />
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
                  Manage chat groups and team conversations.
                </p>
              </div>
            </div>
            <ChatGroupSettings />
          </div>
        )}

        {tab === "video" && !isSetupMode && <ZegoSettingsForm />}

        {tab === "support" && !isSetupMode && <SupportTab />}

        {tab === "notifications" && !isSetupMode && <NotificationsSettings />}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 animate-pulse text-muted-foreground">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
