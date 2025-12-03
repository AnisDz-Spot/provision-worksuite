"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  className?: string;
};

export const MetricCard = React.memo(function MetricCard({
  title,
  value,
  className,
}: Props) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-xl md:text-2xl font-semibold">{value}</div>
    </div>
  );
});
