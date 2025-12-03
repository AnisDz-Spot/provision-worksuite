"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { calculateRiskScore, type RiskAnalysis } from "@/lib/utils";
import { AlertTriangle, Shield, AlertCircle, Info } from "lucide-react";

type RiskScoreProps = {
  projectId: string;
  deadline?: string;
};

export function RiskScore({ projectId, deadline }: RiskScoreProps) {
  const [risk, setRisk] = React.useState<RiskAnalysis | null>(null);

  React.useEffect(() => {
    const analysis = calculateRiskScore(projectId, deadline);
    setRisk(analysis);
  }, [projectId, deadline]);

  if (!risk) return null;

  const getRiskColor = (level: RiskAnalysis["level"]) => {
    switch (level) {
      case "critical":
        return "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20";
    }
  };

  const getRiskIcon = (level: RiskAnalysis["level"]) => {
    switch (level) {
      case "critical":
        return <AlertTriangle className="w-6 h-6" />;
      case "high":
        return <AlertCircle className="w-6 h-6" />;
      case "medium":
        return <Info className="w-6 h-6" />;
      case "low":
        return <Shield className="w-6 h-6" />;
    }
  };

  const factorLabels = {
    overdueTasksRisk: "Overdue Tasks",
    velocityRisk: "Velocity Trend",
    blockerRisk: "Blocked Tasks",
    deadlineRisk: "Deadline Pressure",
    estimateAccuracyRisk: "Estimate Accuracy",
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Project Risk Score</h3>

        {/* Risk Level Display */}
        <div
          className={`p-6 rounded-lg border ${getRiskColor(risk.level)} mb-6`}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">{getRiskIcon(risk.level)}</div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold">{risk.score}</span>
                <span className="text-lg text-muted-foreground">/ 100</span>
              </div>
              <p className="text-sm font-medium uppercase tracking-wider">
                {risk.level} Risk
              </p>
            </div>
          </div>
        </div>

        {/* Risk Factors Breakdown */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Risk Factors
          </p>
          {Object.entries(risk.factors).map(([key, value]) => {
            const factorKey = key as keyof typeof risk.factors;
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{factorLabels[factorKey]}</span>
                  <span className="font-medium">{value.toFixed(0)}%</span>
                </div>
                <div className="relative h-2 bg-secondary rounded overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded transition-all ${
                      value >= 70
                        ? "bg-red-500"
                        : value >= 50
                          ? "bg-orange-500"
                          : value >= 30
                            ? "bg-yellow-500"
                            : "bg-green-500"
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Recommendations</p>
          <ul className="space-y-2">
            {risk.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risk Level Guide */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Risk Levels
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-muted-foreground">Low (0-29)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-muted-foreground">Medium (30-49)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-muted-foreground">High (50-69)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-muted-foreground">Critical (70+)</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
