"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

interface Risk {
  level: "high" | "medium" | "low";
  description: string;
  impact: string;
}

interface Suggestion {
  action: string;
  priority: "high" | "medium" | "low";
}

interface AnalysisResult {
  summary: string;
  risks: Risk[];
  suggestions: Suggestion[];
}

export function PortfolioRiskAI() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalysis = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/ai/analyze-portfolio");
      const result = await res.json();
      if (result.success) {
        setData({
          summary: result.summary,
          risks: result.risks || [],
          suggestions: result.suggestions || [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch AI analysis:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (loading) {
    return (
      <Card className="h-full border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            AI Portfolio Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-primary/20 bg-primary/5 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BrainCircuit className="w-5 h-5 text-primary" />
          AI Portfolio Insights
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:bg-primary/10"
          onClick={() => loadAnalysis(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Insights */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 bg-primary/5">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <p className="text-sm italic text-foreground/90">
              "{data?.summary}"
            </p>
          </div>
        </div>

        {/* Risks */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Key Strategic Risks
          </h4>
          <div className="space-y-3">
            {data?.risks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No high-level risks identified.
              </p>
            ) : (
              data?.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-background border border-border/50 shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge
                      variant={
                        risk.level === "high" ? "secondary" : ("default" as any)
                      }
                      className="text-[10px]"
                    >
                      {risk.level}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold">{risk.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                    Impact: {risk.impact}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold mb-3 uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            Remedial Suggestions
          </h4>
          <div className="space-y-2">
            {data?.suggestions.map((s, idx) => (
              <div key={idx} className="flex gap-3 items-start group">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground">
                    {s.action}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[9px] uppercase font-bold opacity-60 border"
                >
                  {s.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
