"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
};

export function SectionHeader({
  icon,
  title,
  subtitle,
  right,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="shrink-0">{icon}</div>}
        <div>
          <div className="text-lg font-semibold leading-tight">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
