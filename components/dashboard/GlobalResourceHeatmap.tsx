"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, AlertCircle, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface MemberLoad {
  id: string;
  name: string;
  avatarUrl?: string;
  taskCount: number;
  highPriorityCount: number;
  loadLevel: "low" | "medium" | "high" | "critical";
  score: number;
}

export function GlobalResourceHeatmap() {
  const [data, setData] = useState<MemberLoad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoad() {
      try {
        const res = await fetch("/api/analytics/resource-load");
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch resource load:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLoad();
  }, []);

  const getLoadColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-500 shadow-red-500/20";
      case "high":
        return "bg-orange-500 shadow-orange-500/20";
      case "medium":
        return "bg-yellow-500 shadow-yellow-500/20";
      default:
        return "bg-green-500 shadow-green-500/20";
    }
  };

  const getLoadLabel = (level: string) => {
    switch (level) {
      case "critical":
        return "Overloaded";
      case "high":
        return "Heavy";
      case "medium":
        return "Optimal";
      default:
        return "Available";
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Global Resource Workload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-2">
          {data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground italic text-sm">
              No member data available.
            </p>
          ) : (
            data.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold leading-tight">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                      {member.taskCount} Active Tasks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {member.highPriorityCount > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertCircle className="w-4 h-4 animate-pulse" />
                            <span className="text-[10px] font-bold">
                              {member.highPriorityCount}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {member.highPriorityCount} high-priority tasks
                          assigned
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <div className="flex flex-col items-end gap-1 min-w-[80px]">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => {
                        const isActive =
                          (member.loadLevel === "low" && i === 1) ||
                          (member.loadLevel === "medium" && i <= 2) ||
                          (member.loadLevel === "high" && i <= 3) ||
                          member.loadLevel === "critical";
                        return (
                          <div
                            key={i}
                            className={`w-3 h-1.5 rounded-full transition-colors ${isActive ? getLoadColor(member.loadLevel) : "bg-muted"}`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {getLoadLabel(member.loadLevel)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-3 bg-muted/40 rounded-lg flex items-start gap-2 border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Workload is calculated based on active task volume and priority
            weightings.
            <span className="font-bold text-primary ml-1 underline cursor-pointer">
              Optimize Assignments
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
