"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Brain,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface AnalysisResult {
  healthScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  summary: string;
  topRisks: string[];
  recommendations: string[];
  sentiment: "positive" | "neutral" | "concerning";
}

/**
 * AIProjectAnalyst Component
 * Displays a card that allows users to trigger an AI analysis of the project.
 */
export function AIProjectAnalyst({
  projectId,
}: {
  projectId: string | number;
}) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Triggers the project analysis API call
   */
  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(`/api/ai/analyze-project/${projectId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError(
          data.error || "Analysis failed. Please check your AI settings."
        );
      }
    } catch (err) {
      setError(
        "Failed to connect to AI service. Ensure you have an active internet connection."
      );
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <Card className="border-indigo-200 dark:border-indigo-900/50 shadow-md transform transition-all duration-300 hover:shadow-lg overflow-hidden">
      <CardHeader className="bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">
                AI Project Analyst
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-black">
                  Predictive Insights
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground">
                  v1.2 Agent
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!analysis && !loading && (
              <Button
                size="sm"
                onClick={runAnalysis}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                Analyze Health
              </Button>
            )}
            {analysis && !loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={runAnalysis}
                className="border-indigo-200 hover:bg-indigo-50"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Re-analyze
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 min-h-[160px] flex flex-col justify-center">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-4 h-4 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">
                Running Neural Diagnostic...
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
                Scanning tasks, timelines, and blocker matrices for risk
                patterns.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-700 dark:text-red-400 flex items-start gap-4 animate-in slide-in-from-top-2">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Diagnostic Failed</h4>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {!analysis && !loading && !error && (
          <div className="py-8 text-center bg-muted/10 rounded-2xl border border-dashed border-border group hover:bg-muted/20 transition-colors cursor-default">
            <Shield className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3 group-hover:text-indigo-500/20 transition-colors" />
            <h4 className="text-sm font-semibold text-muted-foreground">
              Ready for Diagnosis
            </h4>
            <p className="text-xs text-muted-foreground/70 mt-1">
              AI can predict delays before they happen.
            </p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <div className="flex items-end gap-3 mb-2">
                    <div className="text-5xl font-black text-indigo-600 tracking-tighter">
                      {analysis.healthScore}
                    </div>
                    <div className="pb-1 text-sm font-bold text-muted-foreground/80 uppercase">
                      / 100 Health Score
                    </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                      style={{ width: `${analysis.healthScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                      Risk Level:
                    </span>
                    <Badge
                      className={`${getRiskColor(analysis.riskLevel)} border-2 font-black px-3 py-0.5 capitalize shadow-sm`}
                    >
                      {analysis.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                      Sentiment:
                    </span>
                    <Badge
                      variant="default"
                      className="font-bold px-3 py-0.5 capitalize"
                    >
                      {analysis.sentiment}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 relative overflow-hidden group">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                <strong className="block text-[10px] uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 font-black">
                  Executive Summary
                </strong>
                <p className="text-sm leading-relaxed text-indigo-900 dark:text-indigo-200 italic font-medium">
                  "{analysis.summary}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border/50">
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Primary Vulnerabilities
                </h4>
                <div className="space-y-2.5">
                  {analysis.topRisks.map((risk, i) => (
                    <div
                      key={i}
                      className="text-xs p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100/30 dark:border-red-900/20 flex items-start gap-3 group hover:border-red-300 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                      <span className="font-medium">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Tactical Countermeasures
                </h4>
                <div className="space-y-2.5">
                  {analysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="text-xs p-3 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100/30 dark:border-green-900/20 flex items-start gap-3 group hover:border-green-300 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                      <span className="font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
