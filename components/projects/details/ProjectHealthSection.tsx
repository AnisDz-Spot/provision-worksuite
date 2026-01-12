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
  const progress = getTaskCompletionForProject(project.id)?.percent || 0;

  const health = calculateProjectHealth({
    progress,
    deadline: project.deadline || "",
    status: project.status,
  });

  return (
    <div className="flex items-center gap-4">
      <HealthBadge
        projectId={project.uid || project.id}
        projectName={project.name}
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
