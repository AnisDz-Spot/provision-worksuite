"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  children,
  size = "md",
  className,
}: ModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm animate-fadeIn"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          "fixed z-50 bg-card border rounded-xl shadow-lg overflow-hidden p-7 min-w-[300px]",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl",
          size === "full" && "min-w-[50vw] max-w-[90vw] max-h-[85vh]",
          className
        )}
        style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}


