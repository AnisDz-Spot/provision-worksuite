"use client";
import { useState } from "react";
import { Bell } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AlertRulesManager } from "@/components/notifications/AlertRulesManager";
import { ProjectWatch } from "@/components/notifications/ProjectWatch";
import { IntegrationSettings } from "@/components/notifications/IntegrationSettings";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<
    "notifications" | "rules" | "watch" | "integrations"
  >("notifications");

  return (
    <section className="p-4 md:p-8 flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Manage notifications, alerts, and integrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "notifications"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "rules"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Alert Rules
          </button>
          <button
            onClick={() => setActiveTab("watch")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "watch"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Project Watch
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
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

      {/* Tab Content */}
      <div>
        {activeTab === "notifications" && <NotificationCenter />}
        {activeTab === "rules" && <AlertRulesManager />}
        {activeTab === "watch" && <ProjectWatch />}
        {activeTab === "integrations" && <IntegrationSettings />}
      </div>
    </section>
  );
}
