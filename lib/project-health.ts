/**
 * Project Health Score Utilities
 *
 * Calculates and categorizes project health based on multiple factors:
 * - Timeline adherence (progress vs deadline)
 * - Velocity trends
 * - Blocker count and severity
 * - Budget variance (if applicable)
 */

export type HealthLevel = "healthy" | "warning" | "at-risk" | "critical";

export interface HealthScore {
  level: HealthLevel;
  score: number; // 0-100
  factors: {
    timeline: number;
    velocity: number;
    blockers: number;
    budget: number;
  };
  details: {
    timelineStatus: string;
    velocityTrend: string;
    blockerCount: number;
    budgetVariance?: number;
  };
}

export interface ProjectHealthInput {
  progress: number; // 0-100
  deadline?: string | Date;
  createdAt?: string | Date;
  velocity?: number; // current velocity
  avgVelocity?: number; // historical average
  blockers?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  budget?: number;
  spent?: number;
  status?: string;
}

/**
 * Calculate timeline health score (0-100)
 * Based on whether progress is on track with time elapsed
 */
function calculateTimelineHealth(input: ProjectHealthInput): number {
  const { progress, deadline, createdAt, status } = input;

  // Completed projects are always healthy
  if (status?.toLowerCase() === "completed" || progress >= 100) {
    return 100;
  }

  // If no deadline, assume 75 (good but not perfect)
  if (!deadline) {
    return 75;
  }

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const startDate = createdAt
    ? new Date(createdAt)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalDuration = deadlineDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const remaining = deadlineDate.getTime() - now.getTime();

  // Calculate expected progress based on time elapsed
  const expectedProgress =
    totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  // Calculate buffer (how much ahead/behind we are)
  const progressDiff = progress - expectedProgress;

  // Score based on buffer
  if (progressDiff >= 20) return 100; // Way ahead
  if (progressDiff >= 10) return 90; // Ahead of schedule
  if (progressDiff >= 0) return 80; // On track
  if (progressDiff >= -10) return 60; // Slightly behind
  if (progressDiff >= -20) return 40; // Behind schedule
  return 20; // Critically behind
}

/**
 * Calculate velocity health score (0-100)
 * Based on current velocity vs historical average
 */
function calculateVelocityHealth(input: ProjectHealthInput): number {
  const { velocity, avgVelocity, progress } = input;

  // If no velocity data, use progress as proxy
  if (!velocity || !avgVelocity) {
    if (progress >= 80) return 90;
    if (progress >= 60) return 75;
    if (progress >= 40) return 60;
    return 50;
  }

  // Compare current to average
  const ratio = velocity / avgVelocity;

  if (ratio >= 1.3) return 100; // Accelerating significantly
  if (ratio >= 1.1) return 90; // Accelerating
  if (ratio >= 0.9) return 80; // Steady
  if (ratio >= 0.7) return 60; // Slowing
  if (ratio >= 0.5) return 40; // Slowing significantly
  return 20; // Stalled
}

/**
 * Calculate blocker health score (0-100)
 * Based on number and severity of blockers
 */
function calculateBlockerHealth(input: ProjectHealthInput): number {
  const { blockers } = input;

  if (!blockers) return 100; // No blockers = perfect

  const critical = blockers.critical || 0;
  const high = blockers.high || 0;
  const medium = blockers.medium || 0;
  const low = blockers.low || 0;

  // Weighted blocker score (more weight to critical)
  const blockerScore = critical * 10 + high * 5 + medium * 2 + low * 1;

  if (blockerScore === 0) return 100;
  if (blockerScore <= 2) return 90;
  if (blockerScore <= 5) return 75;
  if (blockerScore <= 10) return 60;
  if (blockerScore <= 20) return 40;
  return 20;
}

/**
 * Calculate budget health score (0-100)
 * Based on budget variance
 */
function calculateBudgetHealth(input: ProjectHealthInput): number {
  const { budget, spent, progress } = input;

  if (!budget || !spent) return 80; // No budget data = assume okay

  const variance = (spent / budget) * 100;
  const expectedSpend = progress; // Ideally spend = progress

  const diff = variance - expectedSpend;

  if (diff <= 5) return 100; // Under budget
  if (diff <= 10) return 90; // Slightly over but acceptable
  if (diff <= 20) return 70; // Over budget
  if (diff <= 30) return 50; // Significantly over
  return 30; // Critically over budget
}

/**
 * Calculate overall project health score
 */
export function calculateProjectHealth(input: ProjectHealthInput): HealthScore {
  const timelineScore = calculateTimelineHealth(input);
  const velocityScore = calculateVelocityHealth(input);
  const blockerScore = calculateBlockerHealth(input);
  const budgetScore = calculateBudgetHealth(input);

  // Weighted average
  const weights = {
    timeline: 0.3,
    velocity: 0.25,
    blockers: 0.25,
    budget: 0.2,
  };

  const overallScore = Math.round(
    timelineScore * weights.timeline +
      velocityScore * weights.velocity +
      blockerScore * weights.blockers +
      budgetScore * weights.budget
  );

  // Determine health level
  let level: HealthLevel;
  if (overallScore >= 80) level = "healthy";
  else if (overallScore >= 60) level = "warning";
  else if (overallScore >= 40) level = "at-risk";
  else level = "critical";

  // Generate details
  const totalBlockers =
    (input.blockers?.critical || 0) +
    (input.blockers?.high || 0) +
    (input.blockers?.medium || 0) +
    (input.blockers?.low || 0);

  return {
    level,
    score: overallScore,
    factors: {
      timeline: timelineScore,
      velocity: velocityScore,
      blockers: blockerScore,
      budget: budgetScore,
    },
    details: {
      timelineStatus: getTimelineStatus(timelineScore),
      velocityTrend: getVelocityStatus(velocityScore),
      blockerCount: totalBlockers,
      budgetVariance:
        input.budget && input.spent
          ? (input.spent / input.budget) * 100 - input.progress
          : undefined,
    },
  };
}

function getTimelineStatus(score: number): string {
  if (score >= 90) return "Ahead of schedule";
  if (score >= 80) return "On track";
  if (score >= 60) return "Slightly behind";
  if (score >= 40) return "Behind schedule";
  return "Critically delayed";
}

function getVelocityStatus(score: number): string {
  if (score >= 90) return "Accelerating";
  if (score >= 80) return "Steady";
  if (score >= 60) return "Slowing";
  return "Stalled";
}

/**
 * Get health color class for Tailwind
 */
export function getHealthColor(level: HealthLevel): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (level) {
    case "healthy":
      return {
        bg: "bg-green-500/10",
        text: "text-green-600",
        border: "border-green-500/20",
        badge: "bg-green-500",
      };
    case "warning":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-600",
        border: "border-yellow-500/20",
        badge: "bg-yellow-500",
      };
    case "at-risk":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-600",
        border: "border-orange-500/20",
        badge: "bg-orange-500",
      };
    case "critical":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600",
        border: "border-red-500/20",
        badge: "bg-red-500",
      };
  }
}

/**
 * Get health icon component name
 */
export function getHealthIcon(level: HealthLevel): string {
  switch (level) {
    case "healthy":
      return "CheckCircle2";
    case "warning":
      return "AlertCircle";
    case "at-risk":
      return "AlertTriangle";
    case "critical":
      return "XCircle";
  }
}

/**
 * Get health label
 */
export function getHealthLabel(level: HealthLevel): string {
  switch (level) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "at-risk":
      return "At Risk";
    case "critical":
      return "Critical";
  }
}
