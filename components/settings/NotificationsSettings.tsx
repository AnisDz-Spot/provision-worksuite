"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { AlertRulesManager } from "@/components/notifications/AlertRulesManager";
import { ProjectWatch } from "@/components/notifications/ProjectWatch";
import { IntegrationSettings } from "@/components/notifications/IntegrationSettings";

export function NotificationsSettings() {
  const [active, setActive] = useState<
    "notifications" | "rules" | "watch" | "integrations"
  >("notifications");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        <Button
          variant={active === "notifications" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActive("notifications")}
          className={cn(active === "notifications" && "shadow-sm")}
        >
          Delivery Centers
        </Button>
        <Button
          variant={active === "rules" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActive("rules")}
          className={cn(active === "rules" && "shadow-sm")}
        >
          Alert Rules
        </Button>
        <Button
          variant={active === "watch" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActive("watch")}
          className={cn(active === "watch" && "shadow-sm")}
        >
          Watchlist
        </Button>
        <Button
          variant={active === "integrations" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setActive("integrations")}
          className={cn(active === "integrations" && "shadow-sm")}
        >
          Integrations
        </Button>
      </div>

      <div className="pt-4">
        {active === "notifications" && <NotificationCenter />}
        {active === "rules" && <AlertRulesManager />}
        {active === "watch" && <ProjectWatch />}
        {active === "integrations" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">External Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Connect external services like Slack, WhatsApp, or SMS via
                Twilio.
              </p>
            </div>
            <IntegrationSettings />
          </div>
        )}
      </div>
    </div>
  );
}
