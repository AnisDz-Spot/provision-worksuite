// ---- Dashboard & Risk Analysis Utilities ----

import { getTasksByProject, getTaskCompletionForProject } from "./tasks";
import { getOverdueTaskCount } from "./health-scoring";
import { getVelocityMetrics, getTimeEstimateAccuracy } from "./analytics";

// Helper to read time logs
function readTimeLogs(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:timeLogs");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Risk Score Calculation
export type RiskAnalysis = {
  score: number; // 0-100, higher = more risk
  level: "low" | "medium" | "high" | "critical";
  factors: {
    overdueTasksRisk: number;
    velocityRisk: number;
    blockerRisk: number;
    deadlineRisk: number;
    estimateAccuracyRisk: number;
  };
  recommendations: string[];
};

export function calculateRiskScore(
  projectId: string,
  deadline?: string
): RiskAnalysis {
  let riskScore = 0;
  const factors = {
    overdueTasksRisk: 0,
    velocityRisk: 0,
    blockerRisk: 0,
    deadlineRisk: 0,
    estimateAccuracyRisk: 0,
  };
  const recommendations: string[] = [];

  const tasks = getTasksByProject(projectId);
  const totalTasks = tasks.length;

  // 1. Overdue tasks risk (25% weight)
  const overdueCount = getOverdueTaskCount(projectId);
  if (overdueCount > 0) {
    factors.overdueTasksRisk = Math.min(
      100,
      (overdueCount / Math.max(1, totalTasks)) * 100
    );
    riskScore += factors.overdueTasksRisk * 0.25;
    recommendations.push(
      `${overdueCount} overdue task${overdueCount > 1 ? "s" : ""} - prioritize completion`
    );
  }

  // 2. Velocity risk (20% weight) - declining velocity is risky
  const velocity = getVelocityMetrics(projectId, 4);
  if (velocity.length >= 2) {
    const recent = velocity.slice(-2);
    if (recent[1].completed < recent[0].completed * 0.7) {
      factors.velocityRisk = 60;
      riskScore += 60 * 0.2;
      recommendations.push(
        "Velocity declining - review team capacity and blockers"
      );
    } else if (recent[1].trend === "down") {
      factors.velocityRisk = 30;
      riskScore += 30 * 0.2;
    }
  }

  // 3. Blocker risk (15% weight) - tasks stuck in-progress for too long
  const now = Date.now();
  const stuckTasks = tasks.filter((t) => {
    if (t.status !== "in-progress") return false;
    const logs = readTimeLogs().filter((l: any) => l.taskId === t.id);
    if (logs.length === 0) return true; // no activity
    const lastLog = logs.sort((a: any, b: any) => b.loggedAt - a.loggedAt)[0];
    const daysSinceLog = (now - lastLog.loggedAt) / (1000 * 60 * 60 * 24);
    return daysSinceLog > 7; // stuck if no activity for 7 days
  }).length;

  if (stuckTasks > 0) {
    factors.blockerRisk = Math.min(
      100,
      (stuckTasks / Math.max(1, totalTasks)) * 100
    );
    riskScore += factors.blockerRisk * 0.15;
    recommendations.push(
      `${stuckTasks} task${stuckTasks > 1 ? "s" : ""} appear blocked - review progress`
    );
  }

  // 4. Deadline risk (25% weight)
  if (deadline) {
    const daysLeft = Math.ceil(
      (new Date(deadline).getTime() - now) / (1000 * 60 * 60 * 24)
    );
    const completion = getTaskCompletionForProject(projectId);
    const remainingWork = totalTasks - completion.done;

    if (daysLeft < 0) {
      factors.deadlineRisk = 100;
      riskScore += 100 * 0.25;
      recommendations.push("Project overdue - immediate action required");
    } else if (daysLeft <= 3 && completion.percent < 80) {
      factors.deadlineRisk = 80;
      riskScore += 80 * 0.25;
      recommendations.push(
        "Deadline approaching with significant work remaining"
      );
    } else if (daysLeft <= 7 && completion.percent < 70) {
      factors.deadlineRisk = 60;
      riskScore += 60 * 0.25;
      recommendations.push("Consider extending deadline or reducing scope");
    } else if (remainingWork > 0 && daysLeft > 0) {
      const requiredVelocity = remainingWork / daysLeft;
      const recentVelocity =
        velocity.length > 0 ? velocity[velocity.length - 1].avgVelocity : 1;
      if (requiredVelocity > recentVelocity * 1.5) {
        factors.deadlineRisk = 50;
        riskScore += 50 * 0.25;
        recommendations.push("Required velocity exceeds current pace");
      }
    }
  }

  // 5. Estimate accuracy risk (15% weight) - poor estimates increase risk
  const accuracy = getTimeEstimateAccuracy(projectId);
  if (accuracy.tasks.length >= 3) {
    if (accuracy.avgVariance > 40) {
      factors.estimateAccuracyRisk = 70;
      riskScore += 70 * 0.15;
      recommendations.push(
        "Time estimates significantly off - review estimation process"
      );
    } else if (accuracy.avgVariance > 25) {
      factors.estimateAccuracyRisk = 40;
      riskScore += 40 * 0.15;
      recommendations.push("Moderate estimation variance - refine estimates");
    }
  }

  // Determine risk level
  let level: RiskAnalysis["level"];
  if (riskScore >= 70) level = "critical";
  else if (riskScore >= 50) level = "high";
  else if (riskScore >= 30) level = "medium";
  else level = "low";

  if (recommendations.length === 0) {
    recommendations.push("Project tracking well - maintain current velocity");
  }

  return {
    score: parseFloat(riskScore.toFixed(1)),
    level,
    factors,
    recommendations,
  };
}

// Dashboard Statistics
export function getDashboardStats() {
  // Placeholder for dashboard-specific statistics
  // Can be extended as needed
  return {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
  };
}

// Get Recent Activity
export function getRecentActivity(days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const logs = readTimeLogs().filter((log: any) => log.loggedAt >= cutoff);

  return logs
    .sort((a: any, b: any) => b.loggedAt - a.loggedAt)
    .slice(0, 20)
    .map((log: any) => ({
      id: log.id,
      type: "time_log",
      timestamp: log.loggedAt,
      description: `Logged ${log.hours}h on task`,
    }));
}
