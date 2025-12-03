"use client";
import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  percent: number; // 0..100
  className?: string;
  color?: "success" | "warning" | "danger";
};

export const ProgressBar = React.memo(function ProgressBar({
  percent,
  className,
  color = "success",
}: Props) {
  const clamp = Math.max(0, Math.min(100, percent || 0));
  const bar =
    color === "danger"
      ? "bg-red-500"
      : color === "warning"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div
      className={cn("h-3 w-full rounded bg-accent overflow-hidden", className)}
    >
      <div
        className={cn("h-full transition-all", bar)}
        style={{ width: `${clamp}%` }}
      />
    </div>
  );
});
