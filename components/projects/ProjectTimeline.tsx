"use client";
import * as React from "react";
import { getProjectEvents, ProjectEvent } from "@/lib/utils";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

const typeLabel: Record<ProjectEvent["type"], string> = {
  create: "Project created",
  edit: "Project updated",
  star: "Starred",
  unstar: "Unstarred",
  delete: "Deleted",
};

// Restrict to allowed Badge variants (no 'destructive' in BadgeProps union)
const typeColor: Record<
  ProjectEvent["type"],
  "info" | "secondary" | "warning" | "default" | "success"
> = {
  create: "info",
  edit: "secondary",
  star: "warning",
  unstar: "secondary",
  delete: "warning", // use warning for delete events
};

export function ProjectTimeline({
  projectId,
  compact,
}: {
  projectId: string;
  compact?: boolean;
}) {
  const [events, setEvents] = React.useState<ProjectEvent[]>([]);

  React.useEffect(() => {
    setEvents(getProjectEvents(projectId));
    const interval = setInterval(() => {
      setEvents(getProjectEvents(projectId));
    }, 4000); // lightweight live refresh
    return () => clearInterval(interval);
  }, [projectId]);

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
      <ol className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id} className="flex items-start gap-3">
            <div className="mt-1 w-2 h-2 rounded-full bg-primary/70 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={typeColor[ev.type]} pill>
                  {typeLabel[ev.type]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(ev.timestamp)}
                </span>
              </div>
              {ev.data && (
                <div className="text-xs text-muted-foreground">
                  {Object.entries(ev.data).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-medium">{k}:</span> {String(v)}
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
