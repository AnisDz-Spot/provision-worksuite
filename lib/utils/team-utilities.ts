// ---- Team & Member Utilities ----
// Member workload, contributions, availability, activity tracking

import { readTasks, getTasksByProject, TaskItem } from "./tasks";

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

// Member Workload
export type MemberWorkload = {
  memberName: string;
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalHours: number;
  estimatedHours: number;
  workloadPercent: number; // relative to team
};

export function calculateWorkloadStats(
  tasks: TaskItem[],
  logs: any[]
): MemberWorkload[] {
  const today = new Date().toISOString().slice(0, 10);

  // Group tasks by assignee
  const memberMap = new Map<
    string,
    {
      tasks: TaskItem[];
      logs: any[];
    }
  >();

  tasks.forEach((task) => {
    const assignee = task.assignee || "Unassigned";
    if (!memberMap.has(assignee)) {
      memberMap.set(assignee, { tasks: [], logs: [] });
    }
    memberMap.get(assignee)!.tasks.push(task);
  });

  // Add time logs
  logs.forEach((log) => {
    const task = tasks.find((t) => t.id === log.taskId);
    if (task) {
      const assignee = task.assignee || "Unassigned";
      if (memberMap.has(assignee)) {
        memberMap.get(assignee)!.logs.push(log);
      }
    }
  });

  // Calculate stats
  const workloads: MemberWorkload[] = [];
  const totalTeamTasks = tasks.length;

  memberMap.forEach((data, memberName) => {
    const totalTasks = data.tasks.length;
    const inProgress = data.tasks.filter(
      (t) => t.status === "in-progress"
    ).length;
    const completed = data.tasks.filter((t) => t.status === "done").length;
    const overdue = data.tasks.filter(
      (t) => t.status !== "done" && t.due && t.due < today
    ).length;

    const totalHours = data.logs.reduce(
      (sum: number, log: any) => sum + log.hours,
      0
    );
    const estimatedHours = data.tasks.reduce(
      (sum, t) => sum + (t.estimateHours || 0),
      0
    );
    const workloadPercent =
      totalTeamTasks > 0
        ? parseFloat(((totalTasks / totalTeamTasks) * 100).toFixed(1))
        : 0;

    workloads.push({
      memberName,
      totalTasks,
      inProgress,
      completed,
      overdue,
      totalHours: parseFloat(totalHours.toFixed(1)),
      estimatedHours: parseFloat(estimatedHours.toFixed(1)),
      workloadPercent,
    });
  });

  return workloads.sort((a, b) => b.totalTasks - a.totalTasks);
}

export function getMemberWorkloadStats(projectId?: string): MemberWorkload[] {
  const tasks = projectId ? getTasksByProject(projectId) : readTasks();
  const logs = readTimeLogs();
  return calculateWorkloadStats(tasks, logs);
}

// Individual Contribution Stats
export type ContributionStats = {
  memberName: string;
  tasksCompleted: number;
  timeLogged: number;
  avgTaskTime: number;
  completionRate: number; // percentage of assigned tasks completed
  activeDays: number; // days with activity in last 30 days
  recentActivity: Array<{ date: string; hours: number; tasks: number }>;
};

export function calculateContributionStats(
  memberName: string,
  allTasks: TaskItem[],
  allLogs: any[],
  days = 30
): ContributionStats {
  const memberTasks = allTasks.filter((t) => t.assignee === memberName);
  const memberLogs = allLogs.filter((log: any) => {
    const task = allTasks.find((t) => t.id === log.taskId);
    return task?.assignee === memberName;
  });

  const tasksCompleted = memberTasks.filter((t) => t.status === "done").length;
  const timeLogged = memberLogs.reduce(
    (sum: number, log: any) => sum + log.hours,
    0
  );
  const avgTaskTime =
    tasksCompleted > 0
      ? parseFloat((timeLogged / tasksCompleted).toFixed(1))
      : 0;
  const completionRate =
    memberTasks.length > 0
      ? parseFloat(((tasksCompleted / memberTasks.length) * 100).toFixed(1))
      : 0;

  // Calculate activity by day
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentLogs = memberLogs.filter((log: any) => log.loggedAt >= cutoff);

  const activityMap = new Map<string, { hours: number; tasks: Set<string> }>();
  recentLogs.forEach((log: any) => {
    const date = new Date(log.loggedAt).toISOString().slice(0, 10);
    if (!activityMap.has(date)) {
      activityMap.set(date, { hours: 0, tasks: new Set() });
    }
    const day = activityMap.get(date)!;
    day.hours += log.hours;
    day.tasks.add(log.taskId);
  });

  const activeDays = activityMap.size;
  const recentActivity = Array.from(activityMap.entries())
    .map(([date, data]) => ({
      date,
      hours: parseFloat(data.hours.toFixed(1)),
      tasks: data.tasks.size,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7); // Last 7 days

  return {
    memberName,
    tasksCompleted,
    timeLogged: parseFloat(timeLogged.toFixed(1)),
    avgTaskTime,
    completionRate,
    activeDays,
    recentActivity,
  };
}

export function getContributionStats(
  memberName: string,
  days = 30
): ContributionStats {
  const allTasks = readTasks();
  const allLogs = readTimeLogs();
  return calculateContributionStats(memberName, allTasks, allLogs, days);
}

// Activity Heatmap Data
export type ActivityHeatmapData = {
  hour: number; // 0-23
  day: number; // 0‐6 (Sun-Sat)
  activity: number; // count of logs
  hours: number; // total hours logged
};

export function calculateActivityHeatmap(
  logs: any[],
  days = 30
): ActivityHeatmapData[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((log: any) => log.loggedAt >= cutoff);

  const heatmap = new Map<string, { activity: number; hours: number }>();

  recentLogs.forEach((log: any) => {
    const date = new Date(log.loggedAt);
    const day = date.getDay(); // 0-6
    const hour = date.getHours(); // 0-23
    const key = `${day}-${hour}`;

    if (!heatmap.has(key)) {
      heatmap.set(key, { activity: 0, hours: 0 });
    }
    const cell = heatmap.get(key)!;
    cell.activity++;
    cell.hours += log.hours;
  });

  const data: ActivityHeatmapData[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const cell = heatmap.get(key) || { activity: 0, hours: 0 };
      data.push({
        hour,
        day,
        activity: cell.activity,
        hours: parseFloat(cell.hours.toFixed(1)),
      });
    }
  }

  return data;
}

export function getActivityHeatmap(days = 30): ActivityHeatmapData[] {
  const logs = readTimeLogs(); // Assumes logs have loggedAt property or similar
  // readTimeLogs in this file returns { taskId, hours } but assumes fetching from localStorage which might have more fields if saved that way?
  // profound check: readTimeLogs in top of file returns `any[]`.
  // In getMemberWorkloadStats, it uses `log.taskId`.
  // In getContributionStats, it uses `log.loggedAt`.
  // So `readTimeLogs` returns objects with `loggedAt` property.
  return calculateActivityHeatmap(logs, days);
}

// Member Availability
export type MemberAvailability = {
  memberName: string;
  date: string; // YYYY-MM-DD
  status: "available" | "busy" | "off" | "unknown";
  hoursWorked?: number;
  notes?: string;
};

function readAvailability(): MemberAvailability[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:memberAvailability");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAvailability(data: MemberAvailability[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:memberAvailability", JSON.stringify(data));
  } catch {}
}

export function getMemberAvailability(
  memberName: string,
  startDate: string,
  endDate: string
): MemberAvailability[] {
  const all = readAvailability();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return all.filter((a) => {
    if (a.memberName !== memberName) return false;
    const aTime = new Date(a.date).getTime();
    return aTime >= start && aTime <= end;
  });
}

export function setMemberAvailability(
  availability: Omit<MemberAvailability, "hoursWorked">
) {
  const all = readAvailability();
  const idx = all.findIndex(
    (a) =>
      a.memberName === availability.memberName && a.date === availability.date
  );

  if (idx >= 0) {
    all[idx] = { ...all[idx], ...availability };
  } else {
    all.push(availability as MemberAvailability);
  }

  writeAvailability(all);
}

export function getTeamMembers(): string[] {
  const tasks = readTasks();
  const members = new Set<string>();
  tasks.forEach((task) => {
    if (task.assignee) members.add(task.assignee);
  });
  return Array.from(members).sort();
}

// Member Activity Tracking
export type MemberActivity = {
  memberName: string;
  lastActive: number; // timestamp
  status: "online" | "away" | "offline";
  currentStatus?: "online" | "away" | "offline"; // Alias for backward compatibility
  currentTask?: string;
  location?: string;
};

function readMemberActivities(): MemberActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:memberActivity");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeMemberActivities(activities: MemberActivity[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:memberActivity", JSON.stringify(activities));
  } catch {}
}

export function getMemberActivity(memberName: string): MemberActivity | null {
  const activity =
    readMemberActivities().find((a) => a.memberName === memberName) || null;
  // Ensure currentStatus alias is set
  if (activity && activity.status) {
    activity.currentStatus = activity.status;
  }
  return activity;
}

export function updateMemberActivity(activity: MemberActivity) {
  // Sync status and currentStatus
  if (activity.status && !activity.currentStatus) {
    activity.currentStatus = activity.status;
  } else if (activity.currentStatus && !activity.status) {
    activity.status = activity.currentStatus;
  }

  const all = readMemberActivities();
  const idx = all.findIndex((a) => a.memberName === activity.memberName);
  if (idx >= 0) all[idx] = activity;
  else all.push(activity);
  writeMemberActivities(all);
}

export function getAllMemberActivities(): MemberActivity[] {
  return readMemberActivities();
}

// Chat Messages & Conversations
export type ChatMessage = {
  id: string;
  fromUser: string; // Original property name used by components
  toUser: string; // Original property name used by components
  message: string; // Original property name used by components
  timestamp: number;
  read: boolean;
  conversationId?: string;
  attachment?: {
    id: string;
    name: string;
    type: string;
    url: string; // Data URL for persistence
    size: number;
  };
  status?: "sending" | "sent" | "error";
};

export type ChatConversation = {
  id?: string; // Conversation ID
  withUser: string;
  withUserName?: string;
  withUserAvatar?: string;
  lastMessage: string;
  lastTimestamp: number;
  unreadCount: number;
  isOnline?: boolean;
  type?: string;
  name?: string;
};

function readChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:chatMessages");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeChatMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:chatMessages", JSON.stringify(messages));
  } catch {}
}

export function getChatMessages(user1: string, user2: string): ChatMessage[] {
  return readChatMessages()
    .filter(
      (m) =>
        (m.fromUser === user1 && m.toUser === user2) ||
        (m.fromUser === user2 && m.toUser === user1)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function addChatMessage(
  from: string,
  to: string,
  content: string,
  attachment?: ChatMessage["attachment"]
): ChatMessage {
  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    fromUser: from,
    toUser: to,
    message: content,
    timestamp: Date.now(),
    read: false,
    attachment,
  };
  const all = readChatMessages();
  all.push(msg);
  writeChatMessages(all);
  return msg;
}

// Alias for backward compatibility with existing components
export const sendChatMessage = addChatMessage;

export function markMessagesAsRead(currentUser: string, otherUser: string) {
  const all = readChatMessages();
  const updated = all.map((m) =>
    m.fromUser === otherUser && m.toUser === currentUser
      ? { ...m, read: true }
      : m
  );
  writeChatMessages(updated);
}

export function getChatConversations(currentUser: string): ChatConversation[] {
  const messages = readChatMessages();
  const convos = new Map<string, ChatConversation>();

  messages.forEach((msg) => {
    const otherUser =
      msg.fromUser === currentUser
        ? msg.toUser
        : msg.toUser === currentUser
          ? msg.fromUser
          : "";
    if (!otherUser) return;

    if (!convos.has(otherUser)) {
      convos.set(otherUser, {
        withUser: otherUser,
        lastMessage: "",
        lastTimestamp: 0,
        unreadCount: 0,
      });
    }

    const convo = convos.get(otherUser)!;
    if (msg.timestamp > convo.lastTimestamp) {
      convo.lastMessage = msg.message;
      convo.lastTimestamp = msg.timestamp;
    }
    if (!msg.read && msg.toUser === currentUser) {
      convo.unreadCount++;
    }
  });

  return Array.from(convos.values()).sort(
    (a, b) => b.lastTimestamp - a.lastTimestamp
  );
}

export function getUnreadMessageCount(currentUser: string): number {
  return readChatMessages().filter((m) => m.toUser === currentUser && !m.read)
    .length;
}

// Active Chat Persistence
export function getActiveChatUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pv:activeChatUser");
}

export function setActiveChatUser(username: string | null) {
  if (typeof window === "undefined") return;
  if (username) {
    localStorage.setItem("pv:activeChatUser", username);
  } else {
    localStorage.removeItem("pv:activeChatUser");
  }
}
