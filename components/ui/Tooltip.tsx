"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block group">{children}</div>;
};

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("inline-block", className)} {...props}>
    {children}
  </div>
));
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none min-w-max",
      className,
    )}
    {...props}
  >
    {children}
    {/* Arrow */}
    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border" />
  </div>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
