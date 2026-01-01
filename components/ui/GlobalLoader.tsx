"use client";

import React from "react";
import { useLoading } from "@/context/LoadingContext";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
  const { isLoading, message } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 p-6 bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in duration-300">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>

        {message && (
          <p className="text-sm font-medium text-foreground min-w-[120px] text-center">
            {message}
          </p>
        )}

        {!message && (
          <p className="text-sm font-medium text-foreground">Processing...</p>
        )}
      </div>
    </div>
  );
}
