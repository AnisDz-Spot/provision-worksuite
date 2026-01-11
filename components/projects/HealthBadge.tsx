"use client";

import * as React from "react";
import {
  Heart,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  getHealthColor,
  getHealthLabel,
  type HealthLevel,
} from "@/lib/project-health";

interface HealthBadgeProps {
  score: number;
  level: HealthLevel;
  factors?: {
    timeline: number;
    velocity: number;
    blockers: number;
    budget: number;
  };
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HealthBadge({
  score,
  level,
  factors,
  showTooltip = true,
  size = "md",
  className = "",
}: HealthBadgeProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const colors = getHealthColor(level);
  const label = getHealthLabel(level);

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Icon based on level
  const Icon = {
    healthy: CheckCircle2,
    warning: AlertCircle,
    "at-risk": AlertTriangle,
    critical: XCircle,
  }[level];

  return (
    <div className="relative inline-block">
      <div
        className={`
          flex items-center gap-1.5 rounded-full font-semibold
          ${colors.bg} ${colors.text} ${colors.border} border
          ${sizeClasses[size]}
          ${showTooltip ? "cursor-help" : ""}
          ${className}
          transition-all hover:shadow-md
        `}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        title={showTooltip ? undefined : `Health: ${score}`}
      >
        <Icon className={iconSizes[size]} />
        <span>{score}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && factors && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-popover border border-border rounded-lg shadow-xl">
          <div className="text-xs space-y-2">
            <div className="font-semibold text-center border-b border-border pb-2">
              Health Score: {score}
              <div className="text-[10px] text-muted-foreground font-normal mt-0.5">
                {label}
              </div>
            </div>

            <div className="space-y-1.5">
              <FactorRow label="Timeline" score={factors.timeline} />
              <FactorRow label="Velocity" score={factors.velocity} />
              <FactorRow label="Blockers" score={factors.blockers} />
              <FactorRow label="Budget" score={factors.budget} />
            </div>
            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1 tracking-wider text-center">
                Health Legend
              </p>
              <div className="grid grid-cols-2 gap-x-1 gap-y-1 text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span>80-100: Healthy</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span>60-79: Warning</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span>40-59: At Risk</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>0-39: Critical</span>
                </div>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px pointer-events-none">
            <div className="border-8 border-transparent border-t-border" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(100%+1px)] border-[7px] border-transparent border-t-popover" />
          </div>
        </div>
      )}
    </div>
  );
}

function FactorRow({ label, score }: { label: string; score: number }) {
  const getFactorColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getFactorIcon = (score: number) => {
    if (score >= 80) return "✓";
    if (score >= 60) return "⚠";
    return "✗";
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${getFactorColor(score)}`}>
        {score} {getFactorIcon(score)}
      </span>
    </div>
  );
}
