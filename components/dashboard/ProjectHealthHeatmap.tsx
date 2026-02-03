"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Project } from "@/lib/data";
import {
  calculateProjectHealth,
  getHealthColor,
  getHealthLabel,
} from "@/lib/project-health";
import { getTaskCompletionForProject } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";
import { useRouter } from "next/navigation";

interface ProjectHealthHeatmapProps {
  projects: Project[];
}

export function ProjectHealthHeatmap({ projects }: ProjectHealthHeatmapProps) {
  const router = useRouter();

  const healthData = projects.map((project) => {
    const taskCompletion = getTaskCompletionForProject(project.id);
    const progress = taskCompletion?.percent || project.progress || 0;
    const health = calculateProjectHealth({
      progress,
      deadline: project.deadline,
      status: project.status,
    });
    return { project, health };
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Project Health Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            {healthData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No projects to display
              </p>
            ) : (
              healthData.map(({ project, health }) => {
                const color = getHealthColor(health.level);
                return (
                  <Tooltip key={project.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className={`w-8 h-8 rounded-md ${color.bg} border border-border/50 hover:scale-110 transition-transform cursor-pointer shadow-sm flex items-center justify-center text-[10px] font-bold ${color.text}`}
                        aria-label={`${project.name}: ${getHealthLabel(health.level)}`}
                      >
                        {project.name.charAt(0)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-bold">{project.name}</p>
                        <p className={`${color.text}`}>
                          Health: {getHealthLabel(health.level)} ({health.score}
                          %)
                        </p>
                        <p className="text-muted-foreground mt-1">
                          Click to view project
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })
            )}
          </div>
        </TooltipProvider>

        <div className="mt-6 flex items-center justify-between text-[10px] uppercase font-bold tracking-tighter opacity-70">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green-500" />
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span>Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
