"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  BrainCircuit,
  ArrowRight,
  Users,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface Suggestion {
  taskId: string;
  taskTitle: string;
  fromUser: string;
  toUser: string;
  rationale: string;
  impact: string;
}

interface Bottleneck {
  userName: string;
  reason: string;
}

interface PlanData {
  analysis: string;
  bottlenecks: Bottleneck[];
  suggestions: Suggestion[];
  riskLevel: "high" | "medium" | "low";
}

interface StrategicPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategicPlanModal({
  open,
  onOpenChange,
}: StrategicPlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithCsrf("/api/ai/strategic-plan", {
        method: "POST",
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to generate plan");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !data && !loading) {
      generatePlan();
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                AI Strategic Plan
              </h2>
              <p className="text-sm text-muted-foreground">
                Strategic resource optimization & bottleneck analysis
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generatePlan}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Regenerate
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              <BrainCircuit className="w-12 h-12 text-primary relative animate-bounce" />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">
                Analyzing Portfolio Dynamics...
              </p>
              <p className="text-sm text-muted-foreground">
                Gemini is identifying optimal resource mappings
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/50">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 font-medium">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={generatePlan}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Executive Summary */}
            <section className="bg-primary/5 p-5 rounded-xl border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Info className="w-12 h-12" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
                Executive Summary
              </h3>
              <p className="text-foreground leading-relaxed italic">
                "{data.analysis}"
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bottlenecks */}
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <Users className="w-5 h-5 text-orange-500" />
                  Resource Bottlenecks
                </h3>
                <div className="space-y-3">
                  {data.bottlenecks.map((b, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20 flex gap-3 items-start"
                    >
                      <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm tracking-tight">
                          {b.userName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {b.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                  {data.bottlenecks.length === 0 && (
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <p className="text-sm font-medium">
                        No severe bottlenecks detected.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Suggestions */}
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Reallocations
                </h3>
                <div className="space-y-3">
                  {data.suggestions.map((s, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-card border hover:border-primary/50 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] truncate max-w-[150px]"
                        >
                          {s.taskTitle}
                        </Badge>
                        <Badge
                          variant={
                            data.riskLevel === "high"
                              ? "warning"
                              : ("default" as any)
                          }
                          className="text-[9px]"
                        >
                          {data.riskLevel} IMPACT
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <span className="text-xs font-bold text-orange-500">
                          {s.fromUser}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-bold text-green-500">
                          {s.toUser}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground border-t pt-2 mt-2 leading-tight">
                        <span className="font-bold text-foreground">
                          Rationale:{" "}
                        </span>
                        {s.rationale}
                      </p>
                    </div>
                  ))}
                  {data.suggestions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-10">
                      No reallocations suggested at this time.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => onOpenChange(false)}>Close Plan</Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
