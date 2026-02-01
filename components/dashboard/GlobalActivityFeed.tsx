"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Activity, User, ExternalLink, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar";

interface ActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl?: string;
    email: string;
  };
  metadata?: any;
}

export function GlobalActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch("/api/activities?limit=8");
        const result = await res.json();
        if (result.success) {
          setActivities(result.data);
        }
      } catch (error) {
        console.error("Failed to load global activities:", error);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes("create")) return "text-green-600 dark:text-green-400";
    if (a.includes("delete") || a.includes("remove"))
      return "text-red-600 dark:text-red-400";
    if (a.includes("update") || a.includes("edit"))
      return "text-blue-600 dark:text-blue-400";
    return "text-orange-600 dark:text-orange-400";
  };

  const handleNavigate = (item: ActivityItem) => {
    if (item.entityType === "project") {
      router.push(`/projects/${item.entityId}`);
    } else if (item.metadata?.projectId) {
      router.push(`/projects/${item.metadata.projectId}`);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Global Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic text-sm">
            No recent activity across your projects.
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((item) => (
              <div key={item.id} className="flex items-start gap-3 group">
                <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border group-hover:ring-primary/50 transition-all">
                  <AvatarImage src={item.user.avatarUrl} alt={item.user.name} />
                  <AvatarFallback className="text-[10px] bg-primary/5">
                    {item.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight">
                    <span className="font-bold text-foreground">
                      {item.user.name}
                    </span>{" "}
                    <span
                      className={`font-medium ${getActionColor(item.action)}`}
                    >
                      {item.action}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {item.entityType}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {timeAgo(item.createdAt)}
                    </span>
                    <button
                      onClick={() => handleNavigate(item)}
                      className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-bold"
                    >
                      View <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
