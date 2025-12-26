"use client";
import * as React from "react";
import { getProjectEventsDB, ProjectEvent } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

const typeLabel: Record<string, string> = {
  create: "Project created",
  edit: "Project updated",
  star: "Starred",
  unstar: "Unstarred",
  delete: "Deleted",
  created: "Project created",
  updated: "Project updated",
  deleted: "Project deleted",
  task_created: "Task created",
  task_updated: "Task updated",
};

const typeColor: Record<
  string,
  "info" | "secondary" | "warning" | "default" | "success"
> = {
  create: "info",
  edit: "secondary",
  star: "warning",
  unstar: "secondary",
  delete: "warning",
  created: "info",
  updated: "secondary",
  deleted: "warning",
  task_created: "info",
  task_updated: "secondary",
};

export function ProjectTimeline({
  projectId,
  compact,
}: {
  projectId: string;
  compact?: boolean;
}) {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchEvents = React.useCallback(async () => {
    const data = await getProjectEventsDB(projectId);
    setEvents(data);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      fetchEvents();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  if (loading) {
    return (
      <Card className="p-4 space-y-2 animate-pulse">
        <div className="h-4 bg-accent/20 rounded w-1/4" />
        <div className="space-y-3">
          <div className="h-10 bg-accent/10 rounded" />
          <div className="h-10 bg-accent/10 rounded" />
        </div>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Clock className="w-4 h-4" />
          <span>No recent activity logged.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Activity Timeline</h3>
      </div>
      <ol className="space-y-4">
        {events.map((ev) => (
          <li key={ev.id} className="flex items-start gap-3">
            <div className="relative mt-1">
              {(() => {
                const avatarUrl = ev.user?.avatarUrl || ev.user?.avatar_url;
                if (avatarUrl) {
                  return (
                    <img
                      src={avatarUrl}
                      alt={ev.user.name || "User"}
                      className="w-8 h-8 rounded-full border-2 border-background shadow-sm shrink-0 object-cover"
                    />
                  );
                }
                const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ev.user?.name || "System")}`;
                return (
                  <img
                    src={fallbackUrl}
                    alt={ev.user?.name || "User"}
                    className="w-8 h-8 rounded-full border-2 border-background shadow-sm shrink-0 object-cover"
                  />
                );
              })()}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold truncate leading-none">
                  {ev.user?.name || "System"}
                </span>
                <Badge
                  variant={typeColor[ev.type] || "default"}
                  pill
                  className="text-[10px] py-0 px-2 h-4"
                >
                  {typeLabel[ev.type] || ev.type}
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                  {formatDate(ev.timestamp)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2 italic">
                {ev.data?.title || ev.data?.name || "Activity logged"}
              </div>
              {ev.data && Object.keys(ev.data).length > 1 && (
                <div className="mt-1 p-2 rounded bg-accent/5 text-[10px] grid grid-cols-2 gap-x-2">
                  {Object.entries(ev.data)
                    .slice(0, 4)
                    .filter(([k]) => k !== "title" && k !== "name")
                    .map(([k, v]) => (
                      <div key={k} className="truncate">
                        <span className="text-muted-foreground font-medium">
                          {k}:
                        </span>{" "}
                        {String(v)}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
