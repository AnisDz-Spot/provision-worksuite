"use client";
import * as React from "react";
import { getProjectEventsDB, ProjectEvent } from "@/lib/utils";
import { Clock } from "lucide-react";
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
  timelog: "Logged time",
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
  timelog: "success",
};

export function ProjectTimeline({
  projectId,
  compact,
}: {
  projectId: string | number;
  compact?: boolean;
}) {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(10);
  const [hasMore, setHasMore] = React.useState(true);

  const fetchEvents = React.useCallback(
    async (count: number) => {
      const data = await getProjectEventsDB(projectId, count, 0);
      setEvents(data);
      if (data.length < count) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    },
    [projectId],
  );

  // Initial load
  React.useEffect(() => {
    fetchEvents(visibleCount).then(() => setLoading(false));
  }, [fetchEvents, visibleCount]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(visibleCount);
    }, 30000); // refresh every 30s

    const handler = () => fetchEvents(visibleCount);
    window.addEventListener("pv:timeUpdated", handler);
    window.addEventListener("pv:milestonesUpdated", handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pv:timeUpdated", handler);
      window.removeEventListener("pv:milestonesUpdated", handler);
    };
  }, [fetchEvents, visibleCount]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextCount = visibleCount + 10;
    await fetchEvents(nextCount);
    setVisibleCount(nextCount);
    setLoadingMore(false);
  };

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
                <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                  {formatDate(ev.timestamp)}
                </span>
              </div>
              <div className="text-sm text-foreground/80 leading-snug">
                {(() => {
                  const action = ev.type;
                  const entity =
                    ev.entityType ||
                    (action.startsWith("task_") ? "task" : "project");
                  const data = ev.data || {};
                  const name = data.title || data.name || data.taskTitle || "";

                  if (data.summary) return <span>{data.summary}</span>;

                  if (entity === "task") {
                    const taskName = name ? `"${name}"` : "a task";
                    if (action === "created" || action === "task_created")
                      return (
                        <span>
                          created task{" "}
                          <span className="font-medium text-primary">
                            {taskName}
                          </span>
                        </span>
                      );
                    if (action === "deleted" || action === "task_deleted")
                      return (
                        <span>
                          deleted task{" "}
                          <span className="font-medium text-destructive">
                            {taskName}
                          </span>
                        </span>
                      );
                    if (action === "updated" || action === "task_updated") {
                      if (data.oldStatus && data.status) {
                        return (
                          <span>
                            moved{" "}
                            <span className="font-medium">{taskName}</span> from{" "}
                            <span className="capitalize">
                              {data.oldStatus.replace("_", " ")}
                            </span>{" "}
                            to{" "}
                            <span className="font-bold capitalize text-primary">
                              {data.status.replace("_", " ")}
                            </span>
                          </span>
                        );
                      }
                      if (data.status)
                        return (
                          <span>
                            updated{" "}
                            <span className="font-medium">{taskName}</span>{" "}
                            (Status: {data.status})
                          </span>
                        );
                      return (
                        <span>
                          updated task{" "}
                          <span className="font-medium">{taskName}</span>
                        </span>
                      );
                    }
                  }

                  if (entity === "project") {
                    if (action === "created")
                      return <span>initialized the project</span>;
                    if (action === "status_changed")
                      return (
                        <span>
                          changed project status to{" "}
                          <span className="font-bold text-primary capitalize">
                            {data.status}
                          </span>
                        </span>
                      );
                    if (action === "updated" || action === "edit") {
                      const projName = data.name || data.title;
                      return (
                        <span>
                          updated project details
                          {projName && (
                            <>
                              {" "}
                              for{" "}
                              <span className="font-medium text-primary">
                                "{projName}"
                              </span>
                            </>
                          )}
                        </span>
                      );
                    }
                  }

                  if (action === "timelog")
                    return (
                      <span>
                        logged{" "}
                        <span className="font-medium">{data.hours}h</span> on{" "}
                        <span className="font-medium">{name || "task"}</span>
                      </span>
                    );

                  return <span>{typeLabel[action] || action}</span>;
                })()}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {hasMore && (
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading older activities...
              </>
            ) : (
              "Load older activities"
            )}
          </button>
        </div>
      )}
    </Card>
  );
}
