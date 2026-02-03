"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Clock,
  AlertTriangle,
  ChevronRight,
  Loader2,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";
import { format, parseISO, isAfter, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Prediction {
  projectId: string;
  projectName: string;
  targetDeadline: string;
  predictedDeadline: string;
  confidence: number;
  risk: "high" | "medium" | "low";
  reasoning: string;
}

export function PredictiveTimeline() {
  const [data, setData] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/analytics/predictive-timelines");
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch predictions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Predictive Delivery Timelines
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Predictive Delivery Timelines
        </CardTitle>
        <Badge variant="secondary" className="text-[10px] gap-1">
          <BrainCircuit className="w-3 h-3" />
          AI ESTIMATES
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pt-2">
          {data.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 italic">
              No active projects with sufficient data for prediction.
            </p>
          ) : (
            data.map((p) => {
              const target = parseISO(p.targetDeadline);
              const predicted = parseISO(p.predictedDeadline);
              const isLagging = isAfter(predicted, target);
              const diff = Math.abs(differenceInDays(predicted, target));

              return (
                <div key={p.projectId} className="group relative">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold tracking-tight truncate max-w-[180px]">
                      {p.projectName}
                    </h4>
                    <Badge
                      variant={
                        (p.risk === "high"
                          ? "warning"
                          : p.risk === "medium"
                            ? "info"
                            : "success") as any
                      }
                      className="text-[9px] uppercase font-bold"
                    >
                      {p.risk} Risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-border/40 group-hover:border-primary/20 transition-colors">
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">
                        Target
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {format(target, "MMM d, yyyy")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase">
                        AI Prediction
                      </p>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-bold",
                          isLagging ? "text-orange-500" : "text-green-500",
                        )}
                      >
                        {isLagging ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {format(predicted, "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>

                  {isLagging && diff > 0 && (
                    <div className="mt-2 flex items-center gap-2 px-1">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      <p className="text-[10px] font-medium text-orange-600">
                        Predicted delay of{" "}
                        <span className="font-bold underline">{diff} days</span>
                        . {p.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Timelines are calculated by analyzing current project velocity
            against high-priority task volume. Predictions are updated in
            real-time as work progressed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
