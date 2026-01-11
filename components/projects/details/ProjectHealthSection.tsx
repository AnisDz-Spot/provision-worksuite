import { Button } from "@/components/ui/Button";
import { calculateProjectHealth } from "@/lib/project-health";
import { HealthBadge } from "@/components/projects/HealthBadge";
import { getTaskCompletionForProject } from "@/lib/utils";
import { Project } from "@/hooks/useProjectDetails";

interface ProjectHealthSectionProps {
  project: Project;
  onViewHistory: () => void;
}

export function ProjectHealthSection({
  project,
  onViewHistory,
}: ProjectHealthSectionProps) {
  const taskStats = getTaskCompletionForProject(project.id);
  const progress = taskStats?.percent || 0;

  const health = calculateProjectHealth({
    progress,
    deadline: project.deadline || "",
    status: project.status,
  });

  return (
    <div className="flex items-center gap-4">
      <HealthBadge
        score={health.score}
        level={health.level}
        factors={health.factors}
        size="lg"
      />
      <Button variant="outline" size="sm" onClick={onViewHistory}>
        View history
      </Button>
    </div>
  );
}
