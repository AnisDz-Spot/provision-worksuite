export type DigestSchedule = {
  enabled: boolean;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time: string; // HH:MM format
  recipients: string[];
};

export type DigestProject = {
  id: string | number;
  name: string;
  progress: number;
  status: string;
  tasksCompleted: number;
  upcomingDeadline: string;
  risk: "low" | "high";
};

export type DigestBlocker = {
  title: string;
  severity: string;
  project: string;
};

export type DigestMilestone = {
  title: string;
  date: string;
  project: string;
};

export type DigestSummary = {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksBlocked: number;
  progressPercent: number;
  velocityChange: string; // e.g. "+10%"
  budgetUtilization: number;
  hoursLogged: number;
  teamUtilization: number;
};

export type DigestData = {
  weekRange: string;
  summary: DigestSummary;
  lastWeekSummary: Omit<DigestSummary, "velocityChange" | "budgetUtilization">;
  projects: DigestProject[];
  blockers: DigestBlocker[];
  achievements: string[];
  upcomingMilestones: DigestMilestone[];
};

export type RecipientUser = {
  id: string | number;
  name: string;
  email: string;
  avatar: string;
};
