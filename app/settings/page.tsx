"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Bell,
  Shield,
  Mail,
  HelpCircle,
  Video,
  Bot,
  UserCircle2,
  Settings,
  MessageCircle,
} from "lucide-react";

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

type TabKey = "account" | "workspace" | "communications" | "ai" | "help";

function SettingsContent() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("account");

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
            router.push("/settings?tab=workspace");
          }
        }
      }
    };
    checkSetup();

    const urlTab = searchParams.get("tab");
    if (urlTab) {
      setTab(urlTab as TabKey);
    } else {
      try {
        const saved = localStorage.getItem("pv:settingsTab");
        const validTabs: TabKey[] = [
          "account",
          "workspace",
          "communications",
          "ai",
          "help",
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
          Manage your profile, workspace, and platform configuration.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-hide">
        <Button
          variant={tab === "account" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("account")}
          className={cn(tab === "account" && "shadow", "transition-all")}
        >
          <UserCircle2 className="w-4 h-4 mr-2" />
          Account
        </Button>
        <Button
          variant={tab === "workspace" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("workspace")}
          className={cn(tab === "workspace" && "shadow", "transition-all")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Workspace
        </Button>
        <Button
          variant={tab === "communications" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("communications")}
          className={cn(tab === "communications" && "shadow", "transition-all")}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Integrations
        </Button>
        {isAdmin && (
          <Button
            variant={tab === "ai" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("ai")}
            className={cn(tab === "ai" && "shadow", "transition-all")}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI & Agents
          </Button>
        )}
        <Button
          variant={tab === "help" ? "primary" : "outline"}
          size="sm"
          onClick={() => handleSetTab("help")}
          className={cn(tab === "help" && "shadow", "transition-all")}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help & Support
        </Button>
      </div>

      <div className="tab-content pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* ACCOUNT TAB */}
        {tab === "account" && (
          <div className="space-y-12">
            <UserSettingsForm />
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Security & Authentication
                </h3>
              </div>
              <SecuritySettings />
            </div>
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Theme & UI Preferences</h3>
              </div>
              <AppearanceSettings />
            </div>
          </div>
        )}

        {/* WORKSPACE TAB */}
        {tab === "workspace" && (
          <div className="space-y-12">
            {!isSetupMode && <WorkspaceSettingsForm />}
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Team Roles & Access</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add, remove, or modify roles available to your teams.
                </p>
              </div>
              <RolesSettings />
            </div>
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold">
                  Methodology (Blockers & Risk)
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Define how blockers and project risks are categorized.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BlockerCategorySettings />
                <RiskLevelSettings />
              </div>
            </div>
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold">
                  Infrastructure (Data Source)
                </h3>
              </div>
              <DataSourceSettings />
            </div>
          </div>
        )}

        {/* COMMUNICATIONS TAB */}
        {tab === "communications" && (
          <div className="space-y-12">
            <NotificationsSettings />
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  Email Infrastructure
                </h3>
              </div>
              <IntegrationSettings mode="email" />
              <div className="mt-8">
                <EmailSettings />
              </div>
            </div>
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                  Team Communication
                </h3>
              </div>
              <ChatGroupSettings />
            </div>
            <div className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-500" />
                  Video & Meetings
                </h3>
              </div>
              <ZegoSettingsForm />
            </div>
          </div>
        )}

        {/* AI TAB */}
        {tab === "ai" && (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <AISettings />
          </div>
        )}

        {/* HELP TAB */}
        {tab === "help" && <SupportTab />}
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
