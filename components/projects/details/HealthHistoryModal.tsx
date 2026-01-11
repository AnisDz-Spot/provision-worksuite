import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { calculateProjectHealth, getHealthSeries } from "@/lib/utils";
import { Project } from "@/hooks/useProjectDetails";

interface HealthHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function HealthHistoryModal({
  open,
  onOpenChange,
  project,
}: HealthHistoryModalProps) {
  const health = calculateProjectHealth({
    id: project.id,
    deadline: project.deadline,
    status: project.status,
  });

  const series30 = getHealthSeries(project.id, 30);
  const avg = Math.round(series30.reduce((a, b) => a + b, 0) / series30.length);
  const maxScore = Math.max(...series30);
  const minScore = Math.min(...series30);

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <div className="space-y-6">
        <h3 className="text-xl font-bold">Project Health History</h3>

        {/* Current Health Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-accent/20">
            <div className="text-xs text-muted-foreground mb-1">
              Overall Score
            </div>
            <div className="text-2xl font-bold">{health.score}/100</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/20">
            <div className="text-xs text-muted-foreground mb-1">Deadline</div>
            <div className="text-2xl font-bold">{health.factors.deadline}%</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/20">
            <div className="text-xs text-muted-foreground mb-1">Activity</div>
            <div className="text-2xl font-bold">{health.factors.activity}%</div>
          </div>
          <div className="p-3 rounded-lg bg-accent/20">
            <div className="text-xs text-muted-foreground mb-1">Progress</div>
            <div className="text-2xl font-bold">
              {health.factors.completion}%
            </div>
          </div>
        </div>

        {/* 30-Day Trend Chart */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">30-Day Health Trend</h4>
          <div className="p-6 border rounded-lg bg-linear-to-br from-card to-accent/5">
            <svg viewBox="0 0 300 80" className="w-full h-20">
              {(() => {
                const max = 100,
                  min = 0;
                const pts = series30
                  .map((v, i) => {
                    const x = (i / (series30.length - 1)) * 300;
                    const y = 80 - ((v - min) / (max - min)) * 80;
                    return `${x},${y}`;
                  })
                  .join(" ");
                return (
                  <>
                    <line
                      x1="0"
                      y1="20"
                      x2="300"
                      y2="20"
                      stroke="currentColor"
                      strokeOpacity="0.1"
                    />
                    <line
                      x1="0"
                      y1="40"
                      x2="300"
                      y2="40"
                      stroke="currentColor"
                      strokeOpacity="0.1"
                    />
                    <line
                      x1="0"
                      y1="60"
                      x2="300"
                      y2="60"
                      stroke="currentColor"
                      strokeOpacity="0.1"
                    />
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      points={pts}
                    />
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Average</div>
              <div className="text-lg font-bold">{avg}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Peak</div>
              <div className="text-lg font-bold text-green-600">{maxScore}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-muted-foreground">Lowest</div>
              <div className="text-lg font-bold text-red-600">{minScore}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
