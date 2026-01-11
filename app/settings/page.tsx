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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // Adjust for sticky headers if any
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const subNavs: Record<TabKey, { id: string; label: string }[]> = {
    account: [
      { id: "profile", label: "Profile" },
      { id: "security", label: "Security" },
      { id: "appearance", label: "Appearance" },
    ],
    workspace: [
      { id: "organization", label: "Organization" },
      { id: "roles", label: "Roles" },
      { id: "methodology", label: "Methodology" },
      { id: "infrastructure", label: "Infrastructure" },
    ],
    communications: [
      { id: "notifications", label: "Notifications" },
      { id: "email", label: "Email" },
      { id: "chat", label: "Chat" },
      { id: "video", label: "Video" },
    ],
    ai: [],
    help: [],
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-2 md:-mx-8 md:px-8 border-b border-border shadow-sm">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          <Button
            variant={tab === "account" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("account")}
            className={cn(
              tab === "account" && "shadow",
              "transition-all min-w-fit"
            )}
          >
            <UserCircle2 className="w-4 h-4 mr-2" />
            Account
          </Button>
          <Button
            variant={tab === "workspace" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("workspace")}
            className={cn(
              tab === "workspace" && "shadow",
              "transition-all min-w-fit"
            )}
          >
            <Settings className="w-4 h-4 mr-2" />
            Workspace
          </Button>
          <Button
            variant={tab === "communications" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("communications")}
            className={cn(
              tab === "communications" && "shadow",
              "transition-all min-w-fit"
            )}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Integrations
          </Button>
          {isAdmin && (
            <Button
              variant={tab === "ai" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleSetTab("ai")}
              className={cn(
                tab === "ai" && "shadow",
                "transition-all min-w-fit"
              )}
            >
              <Bot className="w-4 h-4 mr-2" />
              AI & Agents
            </Button>
          )}
          <Button
            variant={tab === "help" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleSetTab("help")}
            className={cn(
              tab === "help" && "shadow",
              "transition-all min-w-fit"
            )}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Help & Support
          </Button>
        </div>

        {/* SUB NAVIGATION (Anchor Links) */}
        {subNavs[tab].length > 0 && (
          <div className="flex gap-4 mt-2 py-2 border-t border-border animate-in slide-in-from-top-2 duration-300 overflow-x-auto scrollbar-hide">
            {subNavs[tab].map((sub) => (
              <button
                key={sub.id}
                onClick={() => scrollToSection(sub.id)}
                className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors whitespace-nowrap uppercase tracking-wider px-1"
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tab-content pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* ACCOUNT TAB */}
        {tab === "account" && (
          <div className="space-y-12">
            <div id="profile">
              <UserSettingsForm />
            </div>
            <div id="security" className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Security & Authentication
                </h3>
              </div>
              <SecuritySettings />
            </div>
            <div id="appearance" className="border-t pt-10">
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
            <div id="organization">
              {!isSetupMode && <WorkspaceSettingsForm />}
            </div>
            <div id="roles" className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold">Team Roles & Access</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add, remove, or modify roles available to your teams.
                </p>
              </div>
              <RolesSettings />
            </div>
            <div id="methodology" className="border-t pt-10">
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
            <div id="infrastructure" className="border-t pt-10">
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
            <div id="notifications">
              <NotificationsSettings />
            </div>
            <div id="email" className="border-t pt-10">
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
            <div id="chat" className="border-t pt-10">
              <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-indigo-500" />
                  Team Communication
                </h3>
              </div>
              <ChatGroupSettings />
            </div>
            <div id="video" className="border-t pt-10">
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
