"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface PulseSummary {
  title: string;
  highlights: string[];
  stats: {
    projectsAnalyzed: number;
    actionsPerformed: number;
    topEntity: string;
  };
  narrative: string;
  riskRating: "low" | "medium" | "high";
}

/**
 * AuditSummary Component
 * Displays an AI-generated executive summary of system activity on the dashboard.
 */
export function AuditSummary() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PulseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  /**
   * Fetches the executive summary from the AI API
   */
  async function fetchSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf("/api/ai/summarize-activity", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      } else {
        setError(
          data.error || "Neural synthesis failed. Check AI configuration."
        );
      }
    } catch (err) {
      setError("AI Engine is currently unreachable.");
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (rating: string) => {
    switch (rating) {
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="h-full border-indigo-100 dark:border-indigo-900/20 overflow-hidden shadow-sm">
        <CardContent className="h-64 flex flex-col items-center justify-center p-8 space-y-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 opacity-60" />
            <Brain className="absolute inset-0 m-auto w-4 h-4 text-indigo-500 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-indigo-900/60 dark:text-indigo-100/60">
              Processing Activity Logs
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black animate-pulse">
              Neural Synthesis in Progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card className="border-red-100 dark:border-red-900/30 shadow-sm">
        <CardContent className="p-8 text-center space-y-5">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-red-500/10">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-tight text-red-800 dark:text-red-400">
              Pulse Offline
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mx-auto">
              {error}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            className="h-9 font-bold px-6"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-indigo-200 dark:border-indigo-900/50 shadow-xl group hover:shadow-2xl transition-all duration-500">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-3xl -mr-24 -mt-24 rounded-full group-hover:bg-indigo-500/10 transition-colors" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl -ml-16 -mb-16 rounded-full group-hover:bg-purple-500/10 transition-colors" />

      <CardHeader className="pb-4 border-b border-indigo-100/50 dark:border-indigo-900/20 bg-linear-to-r from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-background">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/10 transform group-hover:rotate-6 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black tracking-tight">
                {summary.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-black">
                  Agentic Pulse
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <Badge
                  className={`${getRiskColor(summary.riskRating)} border-none text-[9px] h-4.5 px-2 font-black uppercase tracking-tighter`}
                >
                  {summary.riskRating} RISK
                </Badge>
              </div>
            </div>
          </div>
          <button
            onClick={fetchSummary}
            className="p-2 rounded-xl border border-border hover:bg-muted hover:scale-110 active:scale-95 transition-all text-muted-foreground"
            title="Refresh Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8 relative z-10">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-3 rounded-2xl bg-muted/20 border border-border/10 hover:bg-muted/30 transition-colors">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
              Scope
            </p>
            <p className="text-xl font-black text-foreground tabular-nums">
              {summary.stats.projectsAnalyzed}
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-muted/20 border border-border/10 hover:bg-muted/30 transition-colors border-x-indigo-500/10">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
              Signals
            </p>
            <p className="text-xl font-black text-foreground tabular-nums">
              {summary.stats.actionsPerformed}
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-muted/20 border border-border/10 hover:bg-muted/30 transition-colors">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 opacity-60">
              Focus
            </p>
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 truncate uppercase tracking-tighter leading-tight mt-1">
              {summary.stats.topEntity}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-linear-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-l-4 border-indigo-500 p-5 rounded-r-2xl relative">
            <p className="text-sm leading-relaxed text-indigo-900/90 dark:text-indigo-100/90 italic font-semibold">
              "{summary.narrative.split(".")[0]}."
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Intelligence Highlights
            </h4>
            <div className="space-y-2.5">
              {summary.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex gap-4 text-sm p-3 rounded-xl hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all border border-transparent hover:border-indigo-100/50 group/item"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover/item:scale-150 transition-transform" />
                  <span className="font-bold text-foreground/80 leading-snug text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis">
                    {h}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="ghost"
            className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground italic hover:text-indigo-600"
            disabled
          >
            Verified by Agentic Engine
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
