import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CalendarDays } from "lucide-react";
import { Project } from "@/hooks/useProjectDetails";
import { HealthBadge } from "@/components/projects/HealthBadge";
import { calculateProjectHealth } from "@/lib/project-health";
import { getTaskCompletionForProject } from "@/lib/utils";

interface ProjectDetailsHeaderProps {
  project: Project;
  onSaveAsTemplate: () => void;
}

export function ProjectDetailsHeader({
  project,
  onSaveAsTemplate,
}: ProjectDetailsHeaderProps) {
  const today = new Date();
  const deadline = new Date(project.deadline);
  const daysLeft = Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let color = "text-green-600 dark:text-green-400";
  let bgColor = "bg-green-100 dark:bg-green-900/30";
  if (daysLeft < 0) {
    color = "text-red-600 dark:text-red-400";
    bgColor = "bg-red-100 dark:bg-red-900/30";
  } else if (daysLeft <= 7) {
    color = "text-orange-600 dark:text-orange-400";
    bgColor = "bg-orange-100 dark:bg-orange-900/30";
  } else if (daysLeft <= 14) {
    color = "text-amber-600 dark:text-amber-400";
    bgColor = "bg-amber-100 dark:bg-amber-900/30";
  }

  const health = calculateProjectHealth({
    progress: getTaskCompletionForProject(project.id)?.percent || 0,
    deadline: project.deadline || "",
    status: project.status,
  });

  return (
    <div className="bg-card border-b">
      <div className="h-56 bg-muted relative">
        {project.cover ? (
          <Image
            src={project.cover}
            alt={project.name}
            width={1200}
            height={224}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 flex items-center justify-center text-muted-foreground">
            No thumbnail
          </div>
        )}
        {(project.department || project.client) && (
          <div className="absolute top-4 right-4 flex items-center gap-3">
            {project.department && (
              <Badge
                variant="info"
                pill
                className="px-3 py-1 shadow-md bg-card/90 backdrop-blur-sm border-2 border-primary/20"
              >
                {project.department.name}
              </Badge>
            )}
            {project.client && (
              <div className="flex items-center gap-3 bg-card/95 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-lg border border-border">
                {project.clientLogo && (
                  <Image
                    src={project.clientLogo}
                    alt={project.client}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded object-cover"
                  />
                )}
                <span className="text-lg font-bold text-foreground">
                  {project.client}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {project.name}
              </h1>
              <HealthBadge
                projectId={project.uid || project.id}
                projectName={project.name}
                score={health.score}
                level={health.level}
                factors={health.factors}
                size="md"
              />
            </div>
            <div
              className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md ${bgColor} ${color} font-semibold text-base w-fit`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>
                Due:{" "}
                {project.deadline
                  ? new Date(project.deadline)
                      .toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replace(/\//g, "-")
                  : "—"}
              </span>
              {daysLeft >= 0 && (
                <span className="text-sm">
                  ({daysLeft} {daysLeft === 1 ? "day" : "days"} left)
                </span>
              )}
              {daysLeft < 0 && (
                <span className="text-sm">
                  ({Math.abs(daysLeft)}{" "}
                  {Math.abs(daysLeft) === 1 ? "day" : "days"} overdue)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onSaveAsTemplate}>
              Save as Template
            </Button>
            <Link
              href={`/projects/${project.slug || project.uid || project.id}/edit`}
            >
              <Button variant="outline" size="md" className="whitespace-nowrap">
                Edit Project
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              project.status === "Active"
                ? "info"
                : project.status === "Completed"
                  ? "success"
                  : "warning"
            }
            pill
          >
            {project.status}
          </Badge>
          {project.priority && (
            <Badge
              variant={
                project.priority === "high"
                  ? "warning"
                  : project.priority === "medium"
                    ? "info"
                    : "secondary"
              }
              pill
            >
              {project.priority}
            </Badge>
          )}
          {project.privacy && (
            <Badge variant="secondary" pill>
              {project.privacy}
            </Badge>
          )}
          {project.isTemplate && (
            <Badge variant="info" pill>
              Template
            </Badge>
          )}
          {project.budget && (
            <Badge variant="info" pill>
              Budget: ${project.budget}
            </Badge>
          )}
          {project.sla && (
            <Badge variant="info" pill>
              <abbr
                className="border-b border-dashed border-current no-underline cursor-help"
                title="Service Level Agreement"
              >
                SLA
              </abbr>
              : {project.sla} days
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
