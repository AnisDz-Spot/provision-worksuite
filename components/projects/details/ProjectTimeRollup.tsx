import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  getProjectTimeRollup,
  getTasksByProject,
  getTimeLogsForTask,
} from "@/lib/utils";
import { Project } from "@/hooks/useProjectDetails";

interface ProjectTimeRollupProps {
  project: Project;
}

export function ProjectTimeRollup({ project }: ProjectTimeRollupProps) {
  const rollup = getProjectTimeRollup(project.id, project.tasks);

  const tasks = project.tasks || getTasksByProject(project.id);
  const titleMap = new Map(tasks.map((t) => [t.id, t.title]));
  const allLogs = tasks.flatMap((t) => getTimeLogsForTask(t.id));
  const recent = allLogs.sort((a, b) => b.loggedAt - a.loggedAt).slice(0, 12);

  const tickerItems = recent.map(
    (l) =>
      `${l.hours}h • ${titleMap.get(l.taskId) || "Task"} • ${l.loggedBy || "Unknown"} • ${new Date(l.loggedAt).toLocaleString()}`
  );

  return (
    <div className="space-y-4">
      {/* Time Badges */}
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="secondary" pill>
          Est: {rollup.estimate}h
        </Badge>
        <Badge variant="info" pill>
          Logged: {rollup.logged}h
        </Badge>
        <Badge variant="warning" pill>
          Remaining: {rollup.remaining}h
        </Badge>
      </div>

      {/* Marquee Ticker */}
      {tickerItems.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-accent/30">
            <h3 className="text-sm font-semibold">Recent Time Logs</h3>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              auto-scroll
            </span>
          </div>
          <div className="relative h-12 overflow-hidden bg-card flex items-center px-4">
            <div
              className="absolute inset-0 pointer-events-none bg-linear-to-r from-card via-transparent to-card z-10"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
              }}
            />
            <div
              className="flex items-center gap-6 whitespace-nowrap will-change-transform ticker-track"
              style={{
                animation: "pv-marquee 40s linear infinite" as any,
              }}
            >
              {[...tickerItems, ...tickerItems].map((text, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium text-foreground/80 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {text}
                </span>
              ))}
            </div>
          </div>
          <style jsx>{`
            @keyframes pv-marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
            .ticker-track {
              display: flex;
              align-items: center;
            }
            .ticker-track:hover {
              animation-play-state: paused;
            }
          `}</style>
        </Card>
      )}
    </div>
  );
}
