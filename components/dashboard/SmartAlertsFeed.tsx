"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  X,
  ArrowRight,
  Zap,
  TrendingDown,
  Clock,
} from "lucide-react";

interface Action {
  label: string;
  type: string;
}

interface Alert {
  projectId: string;
  title: string;
  severity: "high" | "medium" | "low";
  message: string;
  suggestedAction: Action;
}

export function SmartAlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/ai/smart-alerts");
      const data = await res.json();
      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Failed to load alerts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (alert: Alert) => {
    // In a real app, this would trigger a specific flow based on action.type
    console.log(
      `Executing action: ${alert.suggestedAction.type} for project ${alert.projectId}`,
    );

    // Simulate "Acting" on the alert by removing it with a success state
    // For now, simpler to just dismiss it
    dismissAlert(alert.projectId);
  };

  const dismissAlert = (id: string) => {
    setHidden((prev) => [...prev, id]);
  };

  const visibleAlerts = alerts.filter((a) => !hidden.includes(a.projectId));

  if (loading)
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground animate-pulse">
        <Zap className="mr-2 h-4 w-4" /> Scanning portfolio for anomalies...
      </div>
    );

  if (visibleAlerts.length === 0)
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-dashed border-green-200 dark:border-green-800">
        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
        <p>All systems nominal. No urgent anomalies detected.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Zap className="mr-2 h-5 w-5 text-yellow-500" />
          Actionable Intelligence
        </h3>
        <span className="text-xs font-mono bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
          {visibleAlerts.length} URGENT
        </span>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {visibleAlerts.map((alert) => (
            <motion.div
              key={alert.projectId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={`
                relative p-4 rounded-lg border-l-4 shadow-sm bg-card
                ${
                  alert.severity === "high"
                    ? "border-l-red-500"
                    : alert.severity === "medium"
                      ? "border-l-orange-500"
                      : "border-l-blue-500"
                }
              `}
            >
              <button
                onClick={() => dismissAlert(alert.projectId)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-1.5 rounded-full bg-opacity-10
                  ${
                    alert.severity === "high"
                      ? "bg-red-500 text-red-600"
                      : alert.severity === "medium"
                        ? "bg-orange-500 text-orange-600"
                        : "bg-blue-500 text-blue-600"
                  }
                `}
                >
                  {alert.severity === "high" ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : alert.severity === "medium" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed">
                    {alert.message}
                  </p>

                  {alert.suggestedAction && (
                    <button
                      onClick={() => handleAction(alert)}
                      className="group flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {alert.suggestedAction.label}
                      <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
