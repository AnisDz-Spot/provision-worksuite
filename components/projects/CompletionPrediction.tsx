"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { getTaskCompletionForProject, getProjectTimeRollup } from "@/lib/utils";

type Project = {
  id: string;
  name?: string;
  title?: string;
  deadline: string;
  status: string;
  createdAt?: string;
};

type CompletionPredictionProps = {
  projects: Project[];
};

type VelocityPoint = {
  date: string;
  velocity: number;
  progress: number;
};

// Helper to calculate historical velocity with Monte Carlo simulation
function calculateVelocityMetrics(project: Project, progress: number) {
  const now = new Date();
  const actualCreatedAt = project.createdAt
    ? new Date(project.createdAt)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const daysElapsed = Math.max(
    1,
    (now.getTime() - actualCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Historical velocity snapshots (simulated - in production, track actual daily progress)
  const velocityHistory: VelocityPoint[] = [];
  const intervals = [7, 14, 30]; // Last 7, 14, 30 days

  intervals.forEach((days) => {
    const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    if (pastDate >= actualCreatedAt) {
      const daysPassed = Math.min(days, daysElapsed);
      const progressAtThatTime = Math.max(
        0,
        progress - (30 - daysPassed) * (progress / daysElapsed)
      );
      const vel = progressAtThatTime / daysPassed;
      velocityHistory.push({
        date: pastDate.toISOString(),
        velocity: vel,
        progress: progressAtThatTime,
      });
    }
  });

  // Current velocity
  const currentVelocity = progress / daysElapsed;
  velocityHistory.push({
    date: now.toISOString(),
    velocity: currentVelocity,
    progress: progress,
  });

  // Calculate velocity trend
  const recentVelocities = velocityHistory.slice(-3).map((v) => v.velocity);
  const avgVelocity =
    recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
  const velocityStdDev = Math.sqrt(
    recentVelocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) /
      recentVelocities.length
  );

  // Velocity trend (positive = accelerating, negative = decelerating)
  const velocityTrend =
    recentVelocities.length >= 2
      ? ((recentVelocities[recentVelocities.length - 1] - recentVelocities[0]) /
          recentVelocities[0]) *
        100
      : 0;

  return {
    currentVelocity,
    avgVelocity,
    velocityStdDev,
    velocityTrend,
    velocityHistory,
  };
}

// Monte Carlo simulation for completion date prediction
function monteCarloSimulation(
  currentProgress: number,
  avgVelocity: number,
  velocityStdDev: number,
  iterations: number = 1000
): {
  optimistic: Date;
  realistic: Date;
  pessimistic: Date;
  confidence: number;
} {
  const now = new Date();
  const remainingProgress = 100 - currentProgress;
  const completionDays: number[] = [];

  for (let i = 0; i < iterations; i++) {
    // Random velocity based on normal distribution (Box-Muller transform)
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const simulatedVelocity = Math.max(0.1, avgVelocity + z * velocityStdDev);

    const daysToComplete = remainingProgress / simulatedVelocity;
    completionDays.push(daysToComplete);
  }

  // Sort to find percentiles
  completionDays.sort((a, b) => a - b);

  const p10 = completionDays[Math.floor(iterations * 0.1)]; // Optimistic (10th percentile)
  const p50 = completionDays[Math.floor(iterations * 0.5)]; // Realistic (median)
  const p90 = completionDays[Math.floor(iterations * 0.9)]; // Pessimistic (90th percentile)

  // Confidence based on standard deviation of predictions
  const meanDays = completionDays.reduce((a, b) => a + b, 0) / iterations;
  const stdDev = Math.sqrt(
    completionDays.reduce((sum, d) => sum + Math.pow(d - meanDays, 2), 0) /
      iterations
  );
  const confidence = Math.max(
    40,
    Math.min(95, 100 - (stdDev / meanDays) * 100)
  );

  return {
    optimistic: new Date(now.getTime() + p10 * 24 * 60 * 60 * 1000),
    realistic: new Date(now.getTime() + p50 * 24 * 60 * 60 * 1000),
    pessimistic: new Date(now.getTime() + p90 * 24 * 60 * 60 * 1000),
    confidence: Math.round(confidence),
  };
}

export function CompletionPrediction({ projects }: CompletionPredictionProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [whatIfScenarios, setWhatIfScenarios] = useState<
    Record<string, { teamSize: number; scopeChange: number }>
  >({});
  // Load saved scenarios from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pv:predictionScenario:index");
      if (saved) {
        const index = JSON.parse(saved) as Record<
          string,
          { teamSize: number; scopeChange: number }
        >;
        if (index && typeof index === "object") setWhatIfScenarios(index);
      }
    } catch {}
  }, []);

  const predictions = useMemo(() => {
    return projects.map((project) => {
      const now = new Date();
      const deadline = new Date(project.deadline);

      // Get actual progress from task completion
      const taskCompletion = getTaskCompletionForProject(project.id);
      const progress =
        taskCompletion?.percent ||
        (project.status === "Completed"
          ? 100
          : project.status === "Active"
            ? 65
            : project.status === "In Progress"
              ? 40
              : 20);

      // Calculate velocity metrics with historical data
      const velocityMetrics = calculateVelocityMetrics(project, progress);

      // Apply what-if scenario adjustments
      const scenario = whatIfScenarios[project.id];
      let adjustedVelocity = velocityMetrics.avgVelocity;
      let adjustedProgress = progress;

      if (scenario) {
        // Team size impact: +50% per additional team member (simplified)
        const teamMultiplier = 1 + scenario.teamSize * 0.5;
        adjustedVelocity *= teamMultiplier;

        // Scope change: negative = reduced scope (closer to done), positive = increased scope
        adjustedProgress = Math.max(
          0,
          Math.min(100, progress - scenario.scopeChange)
        );
      }

      // Run Monte Carlo simulation for date predictions
      const mcResults = monteCarloSimulation(
        adjustedProgress,
        adjustedVelocity,
        velocityMetrics.velocityStdDev
      );

      // Calculate days difference (using realistic prediction)
      const daysDiff = Math.floor(
        (deadline.getTime() - mcResults.realistic.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Risk assessment based on buffer and confidence
      let risk: "low" | "medium" | "high" = "low";

      if (daysDiff < -7 || mcResults.confidence < 50) {
        risk = "high";
      } else if (daysDiff < 0 || mcResults.confidence < 70) {
        risk = "medium";
      } else if (daysDiff < 7) {
        risk = "medium";
      }

      return {
        project,
        progress,
        predictedDate: mcResults.realistic,
        optimisticDate: mcResults.optimistic,
        pessimisticDate: mcResults.pessimistic,
        deadline,
        daysDiff: isFinite(daysDiff) ? daysDiff : 0,
        risk,
        velocity: velocityMetrics.currentVelocity.toFixed(2),
        avgVelocity: velocityMetrics.avgVelocity.toFixed(2),
        velocityTrend: velocityMetrics.velocityTrend.toFixed(1),
        velocityHistory: velocityMetrics.velocityHistory,
        confidence: mcResults.confidence,
        onTrack: daysDiff >= 0,
        hasScenario: !!scenario,
        scenarioImpact: scenario
          ? Math.abs(
              daysDiff -
                Math.floor(
                  (deadline.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            )
          : 0,
      };
    });
  }, [projects, whatIfScenarios]);

  const toggleExpanded = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-500/10 border-green-500/20";
      case "medium":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      case "high":
        return "text-red-600 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-600 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <CheckCircle2 className="w-5 h-5" />;
      case "medium":
        return <Clock className="w-5 h-5" />;
      case "high":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            Enhanced Completion Prediction
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-powered forecasts with velocity tracking and Monte Carlo
            simulation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No projects with deadlines to analyze</p>
          </div>
        ) : (
          predictions.map((pred) => {
            const isExpanded = expandedProjects.has(pred.project.id);

            return (
              <div
                key={pred.project.id}
                className="border border-border rounded-lg p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {pred.project.title || pred.project.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>Progress: {pred.progress}%</span>
                      <span>•</span>
                      <span>Current: {pred.velocity}%/day</span>
                      <span>•</span>
                      <span>Avg: {pred.avgVelocity}%/day</span>
                      <span>•</span>
                      <span
                        className={
                          parseFloat(pred.velocityTrend) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {parseFloat(pred.velocityTrend) >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(parseFloat(pred.velocityTrend))}%
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(pred.risk)} flex items-center gap-1 shrink-0`}
                  >
                    {getRiskIcon(pred.risk)}
                    {pred.risk.toUpperCase()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Optimistic (10%)
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      {pred.optimisticDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Realistic (50%)
                    </p>
                    <p className="text-sm font-semibold">
                      {pred.predictedDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Pessimistic (90%)
                    </p>
                    <p className="text-sm font-semibold text-red-600">
                      {pred.pessimisticDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p
                      className={`text-sm font-semibold ${pred.onTrack ? "text-green-600" : "text-red-600"}`}
                    >
                      {pred.deadline.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      <span className="ml-1 text-xs">
                        ({pred.onTrack ? "+" : ""}
                        {pred.daysDiff}d)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Prediction Confidence
                    </span>
                    <span className="font-semibold">{pred.confidence}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pred.confidence >= 80
                            ? "bg-green-500"
                            : pred.confidence >= 60
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${pred.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                {!pred.onTrack && (
                  <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>At Risk:</strong> Project likely to miss deadline
                      by {Math.abs(pred.daysDiff)} days. Consider scope
                      reduction, resource reallocation, or deadline negotiation.
                    </span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpanded(pred.project.id)}
                  className="w-full mt-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Hide Velocity Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show Velocity Details
                    </>
                  )}
                </Button>

                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    {/* What-If Scenario Simulator */}
                    <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">
                          What-If Scenario Simulator
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Add Team Members
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            value={
                              whatIfScenarios[pred.project.id]?.teamSize || 0
                            }
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setWhatIfScenarios((prev) => ({
                                ...prev,
                                [pred.project.id]: {
                                  teamSize: val,
                                  scopeChange:
                                    prev[pred.project.id]?.scopeChange || 0,
                                },
                              }));
                            }}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            Scope Change (%)
                          </label>
                          <Input
                            type="number"
                            min="-50"
                            max="50"
                            value={
                              whatIfScenarios[pred.project.id]?.scopeChange || 0
                            }
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setWhatIfScenarios((prev) => ({
                                ...prev,
                                [pred.project.id]: {
                                  teamSize:
                                    prev[pred.project.id]?.teamSize || 0,
                                  scopeChange: val,
                                },
                              }));
                            }}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const s = whatIfScenarios[pred.project.id];
                            if (!s) return;
                            try {
                              const nextIndex = { ...whatIfScenarios };
                              nextIndex[pred.project.id] = s;
                              localStorage.setItem(
                                `pv:predictionScenario:${pred.project.id}`,
                                JSON.stringify(s)
                              );
                              localStorage.setItem(
                                "pv:predictionScenario:index",
                                JSON.stringify(nextIndex)
                              );
                            } catch {}
                          }}
                        >
                          Save Scenario
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              const raw = localStorage.getItem(
                                `pv:predictionScenario:${pred.project.id}`
                              );
                              if (!raw) return;
                              const s = JSON.parse(raw) as {
                                teamSize: number;
                                scopeChange: number;
                              };
                              setWhatIfScenarios((prev) => ({
                                ...prev,
                                [pred.project.id]: s,
                              }));
                            } catch {}
                          }}
                        >
                          Load Saved
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setWhatIfScenarios((prev) => {
                              const next = { ...prev };
                              delete next[pred.project.id];
                              try {
                                localStorage.removeItem(
                                  `pv:predictionScenario:${pred.project.id}`
                                );
                                localStorage.setItem(
                                  "pv:predictionScenario:index",
                                  JSON.stringify(next)
                                );
                              } catch {}
                              return next;
                            });
                          }}
                        >
                          Clear
                        </Button>
                      </div>

                      {pred.hasScenario && (
                        <div className="text-xs bg-background rounded p-2 border">
                          <strong className="text-blue-600">
                            Scenario Impact:
                          </strong>{" "}
                          {pred.scenarioImpact > 0 ? "+" : ""}
                          {pred.scenarioImpact} days to deadline
                        </div>
                      )}
                    </div>

                    {/* Historical Velocity */}
                    <div className="p-4 bg-accent/30 rounded-lg border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-primary" />
                        <h4 className="font-semibold text-sm">
                          Historical Velocity Tracking
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {pred.velocityHistory.map((point, idx) => {
                          const daysAgo =
                            idx === pred.velocityHistory.length - 1
                              ? "Current"
                              : `${Math.round((new Date().getTime() - new Date(point.date).getTime()) / (1000 * 60 * 60 * 24))} days ago`;

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {daysAgo}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-xs">
                                  Progress: {point.progress.toFixed(1)}%
                                </span>
                                <span className="font-semibold">
                                  {point.velocity.toFixed(2)}%/day
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                        <p className="mb-1">
                          <strong>Methodology:</strong> Monte Carlo simulation
                          with 1000 iterations
                        </p>
                        <p>
                          Predictions based on historical velocity variance and
                          current project progress. Confidence intervals
                          calculated using statistical analysis of velocity
                          patterns.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
