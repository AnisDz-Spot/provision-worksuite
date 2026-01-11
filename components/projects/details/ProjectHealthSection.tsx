import { Button } from "@/components/ui/Button";
import {
  calculateProjectHealth,
  getHealthSeries,
  snapshotHealth,
} from "@/lib/utils";
import { Project } from "@/hooks/useProjectDetails";

interface ProjectHealthSectionProps {
  project: Project;
  onViewHistory: () => void;
}

export function ProjectHealthSection({
  project,
  onViewHistory,
}: ProjectHealthSectionProps) {
  const health = calculateProjectHealth(
    {
      id: project.id,
      deadline: project.deadline,
      status: project.status,
    },
    project.tasks
  );

  try {
    snapshotHealth(project.id, health.score);
  } catch {}

  return (
    <div className="flex items-center gap-4">
      <div
        className={`group relative flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold cursor-default ${
          health.status === "excellent"
            ? "bg-green-100 text-green-700"
            : health.status === "good"
              ? "bg-blue-100 text-blue-700"
              : health.status === "warning"
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            health.status === "excellent"
              ? "bg-green-600"
              : health.status === "good"
                ? "bg-blue-600"
                : health.status === "warning"
                  ? "bg-amber-600"
                  : "bg-red-600"
          }`}
        />
        {health.score}/100 • {health.status.toUpperCase()}
        {/* Popover Breakdown */}
        <div className="absolute top-8 left-0 z-20 hidden group-hover:block">
          <div className="w-80 bg-card border border-border rounded-md shadow-lg p-3 text-xs">
            <div className="font-semibold mb-2">Health Breakdown</div>
            <div className="grid grid-cols-2 gap-y-1">
              <span className="text-muted-foreground">Deadline</span>
              <span className="text-right">{health.factors.deadline}%</span>
              <span className="text-muted-foreground">Activity</span>
              <span className="text-right">{health.factors.activity}%</span>
              <span className="text-muted-foreground">Progress</span>
              <span className="text-right">{health.factors.completion}%</span>
              <span className="text-muted-foreground">Dependencies</span>
              <span className="text-right">{health.factors.dependencies}%</span>
            </div>
            <div className="mt-3">
              <svg viewBox="0 0 120 24" className="w-full h-6">
                {(() => {
                  const series = getHealthSeries(project.id, 14);
                  const max = 100,
                    min = 0;
                  const points = series
                    .map((v, i) => {
                      const x = (i / (series.length - 1)) * 120;
                      const y = 24 - ((v - min) / (max - min)) * 24;
                      return `${x},${y}`;
                    })
                    .join(" ");
                  return (
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      points={points}
                    />
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onViewHistory}>
        View history
      </Button>
    </div>
  );
}
