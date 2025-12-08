import { cn } from "@/lib/utils";
import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "info" | "secondary";
  pill?: boolean;
}

export function Badge({
  variant = "default",
  pill = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border",
        pill ? "rounded-full" : "rounded-md",
        variant === "default" &&
          "bg-accent/60 text-accent-foreground border-accent",
        variant === "success" &&
          "bg-green-100 text-green-900 border-green-300 dark:bg-green-950 dark:text-green-100 dark:border-green-700",
        variant === "warning" &&
          "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-700",
        variant === "info" &&
          "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-700",
        variant === "secondary" &&
          "bg-muted text-muted-foreground border-muted",
        className
      )}
      {...props}
    />
  );
}

