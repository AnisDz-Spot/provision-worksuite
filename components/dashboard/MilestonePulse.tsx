"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Target, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: string;
  project: {
    name: string;
    uid: string;
  };
}

export function MilestonePulse() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadMilestones() {
      try {
        const res = await fetch("/api/milestones/upcoming");
        const result = await res.json();
        if (result.success) {
          setMilestones(result.data);
        }
      } catch (error) {
        console.error("Failed to load upcoming milestones:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMilestones();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Upcoming Milestone Pulse</span>
          <Target className="w-4 h-4 text-primary animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic text-sm">
            No upcoming milestones found.
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => {
              const daysLeft = getDaysRemaining(m.dueDate);
              return (
                <div
                  key={m.id}
                  onClick={() => router.push(`/projects/${m.project.uid}`)}
                  className="group flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/50 hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {m.project.name}
                    </span>
                    <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {m.name}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                    <Badge
                      variant={daysLeft <= 3 ? "warning" : "secondary"}
                      className="text-[10px] py-0 h-5"
                    >
                      {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                    </Badge>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <Calendar className="w-3 h-3" />
                      {formatDate(m.dueDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
