import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  error?: string;
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", size = "md", error, ...props }, ref) => {
    return (
      <div className={cn("w-full", className)}>
        <input
          type={type}
          className={cn(
            "block w-full rounded-md border px-3 py-2 bg-input text-foreground outline-none ring-offset-background transition focus:ring-2",
            size === "sm" && "text-sm py-1",
            size === "lg" && "text-lg py-3",
            error
              ? "border-destructive ring-destructive"
              : "border-border focus:ring-ring"
          )}
          ref={ref}
          {...props}
        />
        {error && <div className="text-destructive text-xs mt-1">{error}</div>}
      </div>
    );
  }
);
Input.displayName = "Input";
