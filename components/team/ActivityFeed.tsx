"use client";
import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Activity,
  CheckCircle,
  MessageSquare,
  UserPlus,
  FileText,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
} from "lucide-react";

export type ActivityType =
  | "task_created"
  | "task_completed"
  | "task_updated"
  | "comment_added"
  | "member_added"
  | "project_created"
  | "status_changed"
  | "risk_identified"
  | "milestone_reached";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  user: string;
  userAvatar: string;
  action: string;
  target?: string;
  projectName?: string;
  timestamp: number;
  metadata?: Record<string, any>;
};

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
  showFilters?: boolean;
}

export function ActivityFeed({
  activities,
  maxItems = 20,
  showFilters = true,
}: ActivityFeedProps) {
  const [filterType, setFilterType] = useState<ActivityType | "all">("all");
  const [timeRange, setTimeRange] = useState<
    "today" | "week" | "month" | "all"
  >("week");

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case "task_created":
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "task_updated":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "comment_added":
        return <MessageSquare className="w-4 h-4 text-purple-600" />;
      case "member_added":
        return <UserPlus className="w-4 h-4 text-indigo-600" />;
      case "project_created":
        return <FileText className="w-4 h-4 text-cyan-600" />;
      case "status_changed":
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case "risk_identified":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "milestone_reached":
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }

    // Filter by time range
    const now = Date.now();
    const ranges = {
      today: 86400000,
      week: 7 * 86400000,
      month: 30 * 86400000,
      all: Infinity,
    };
    filtered = filtered.filter((a) => now - a.timestamp <= ranges[timeRange]);

    // Sort by timestamp
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return filtered.slice(0, maxItems);
  }, [activities, filterType, timeRange, maxItems]);

  const activityTypeOptions: { value: ActivityType | "all"; label: string }[] =
    [
      { value: "all", label: "All Activity" },
      { value: "task_created", label: "Tasks Created" },
      { value: "task_completed", label: "Tasks Completed" },
      { value: "comment_added", label: "Comments" },
      { value: "member_added", label: "Team Changes" },
      { value: "risk_identified", label: "Risks" },
      { value: "milestone_reached", label: "Milestones" },
    ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Team Activity</h2>
          <Badge variant="secondary" className="ml-2">
            {filteredActivities.length}
          </Badge>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as ActivityType | "all")
              }
              className="px-3 py-1.5 text-sm border rounded-md bg-card"
            >
              {activityTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-1.5 text-sm border rounded-md bg-card"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No activity found</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="shrink-0 mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activity.userAvatar}
                    alt={activity.user}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">
                        {activity.action}
                      </span>
                      {activity.target && (
                        <span className="font-medium"> {activity.target}</span>
                      )}
                    </p>
                    {activity.projectName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        in {activity.projectName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {getTimestamp(activity.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
