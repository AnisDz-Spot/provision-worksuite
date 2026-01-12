"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Info,
  Loader2,
  Sparkles,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";

interface RecoveryPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  plan: string | null;
  isLoading: boolean;
}

export function RecoveryPlanModal({
  open,
  onOpenChange,
  projectName,
  plan,
  isLoading,
}: RecoveryPlanModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-xl font-bold">
              AI Recovery Plan: {projectName}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-lg font-semibold">
                Analyzing project health...
              </p>
              <p className="text-sm text-muted-foreground">
                Identifying bottlenecks and crafting immediate actions.
              </p>
            </div>
          </div>
        ) : plan ? (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-primary">Strategic Guidance</p>
                <p className="text-muted-foreground">
                  This plan is generated based on current task velocity, blocker
                  severity, and timeline variance. Suggestions are aimed at
                  stabilizing the project within the next week.
                </p>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none bg-card border rounded-xl p-6 shadow-sm overflow-y-auto max-h-[60vh] scrollbar-thin">
              {/* Simplistic Markdown Rendering for now */}
              <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-medium">
                {plan.split("\n").map((line, i) => {
                  if (line.startsWith("# "))
                    return (
                      <h1
                        key={i}
                        className="text-2xl font-bold mt-6 mb-4 text-primary"
                      >
                        {line.substring(2)}
                      </h1>
                    );
                  if (line.startsWith("## "))
                    return (
                      <h2
                        key={i}
                        className="text-xl font-bold mt-5 mb-3 border-b pb-1"
                      >
                        {line.substring(3)}
                      </h2>
                    );
                  if (line.startsWith("### "))
                    return (
                      <h3 key={i} className="text-lg font-bold mt-4 mb-2">
                        {line.substring(4)}
                      </h3>
                    );
                  if (line.startsWith("- ") || line.startsWith("* "))
                    return (
                      <div key={i} className="flex gap-2 ml-4 my-1">
                        <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  if (line.match(/^\d+\. /))
                    return (
                      <div key={i} className="flex gap-2 ml-4 my-1">
                        <span className="font-bold text-primary">
                          {line.split(".")[0]}.
                        </span>
                        <span>{line.split(".").slice(1).join(".")}</span>
                      </div>
                    );
                  if (line.trim() === "") return <br key={i} />;
                  return (
                    <p key={i} className="my-2">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge
                  variant="success"
                  pill
                  className="px-2 py-0.5 text-[10px]"
                >
                  AI VERIFIED
                </Badge>
                <span className="text-xs text-muted-foreground italic">
                  Powered by Gemini 1.5 Pro
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save as PDF
                </Button>
                <Button size="sm" onClick={() => onOpenChange(false)}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge Plan
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <AlertTriangle className="w-12 h-12 text-yellow-500" />
            <p className="text-center font-medium">
              Could not generate recovery plan. Please check your AI settings.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
