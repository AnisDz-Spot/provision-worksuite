"use client";

import { useState, useEffect } from "react";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";
import { GanttChart } from "@/components/projects/GanttChart";
import { CompletionPrediction } from "@/components/projects/CompletionPrediction";
import { EnhancedBurndownChart } from "@/components/projects/EnhancedBurndownChart";
import { RiskBlockerDashboard } from "@/components/projects/RiskBlockerDashboard";
import { MilestoneGantt } from "@/components/projects/MilestoneGantt";
import { SprintPlanning } from "@/components/projects/SprintPlanning";
import { ResourceAllocation } from "@/components/projects/ResourceAllocation";
import { ProjectStats } from "@/components/dashboard/ProjectStats";
import {
  ProjectsProvider,
  useProjects,
} from "@/components/context/ProjectsContext";
import { Button } from "@/components/ui/Button";
import {
  FolderKanbanIcon,
  LayoutGrid,
  List,
  GanttChartIcon,
  Plus,
} from "lucide-react";
import { QuickTaskModal } from "@/components/dashboard/QuickTaskModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { getProjectDependencies } from "@/lib/utils";

function ProjectsContent() {
  const { projects, isLoading, refreshing, refreshProjects } = useProjects();
  const [view, setView] = useState<"grid" | "list" | "gantt">("grid");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pv:projectsView");
    if (saved === "list" || saved === "grid" || saved === "gantt") {
      setView(saved);
    }
  }, []);

  return (
    <section className="p-4 md:p-8 flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <FolderKanbanIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your projects
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Row 1 on Mobile: Refresh & Timeline */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshProjects()}
            title="Refresh Data"
            disabled={refreshing}
            className="w-full sm:w-auto order-1"
          >
            {refreshing ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              "Refresh"
            )}
          </Button>

          <Button
            variant={view === "gantt" ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setView("gantt");
              localStorage.setItem("pv:projectsView", "gantt");
            }}
            title="Timeline view"
            className="w-full sm:w-auto cursor-pointer order-2"
          >
            <GanttChartIcon className="w-4 h-4 mr-1" />
            <span>Timeline</span>
          </Button>

          {/* Row 2 on Mobile: Grid & List */}
          <div className="flex gap-2 w-full sm:w-auto order-3">
            <Button
              variant={view === "grid" ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                setView("grid");
                localStorage.setItem("pv:projectsView", "grid");
              }}
              title="Grid view"
              className="flex-1 sm:flex-none cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={view === "list" ? "primary" : "outline"}
              size="sm"
              onClick={() => {
                setView("list");
                localStorage.setItem("pv:projectsView", "list");
              }}
              title="List view"
              className="flex-1 sm:flex-none cursor-pointer"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Row 3 on Mobile: New Project */}
          <Button
            variant="primary"
            size="sm"
            asChild
            className="w-full sm:w-auto col-span-2 sm:col-span-1 order-4"
          >
            <a href="/projects/new">
              <Plus className="w-4 h-4 mr-1" />
              <span>New Project</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Dynamic Stats Section */}
      {isLoading && projects.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <ProjectStats projects={projects} />
      )}

      {isLoading && projects.length === 0 ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : view === "gantt" ? (
        <GanttChart
          projects={projects.filter((p) => p.deadline)}
          dependencies={projects.map((p) => ({
            projectId: p.id,
            dependsOn: getProjectDependencies(p.id),
          }))}
        />
      ) : view === "list" ? (
        <ProjectTable />
      ) : (
        <ProjectGrid />
      )}

      {/* Advanced Project Management Features */}
      {/* Only show these if we have projects, to avoid clutter if empty */}
      {projects.length > 0 && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
            <CompletionPrediction projects={projects} />
            <ResourceAllocation />
          </div>

          <div className="mt-8">
            <EnhancedBurndownChart
              projectId="p1"
              projectName="Website Redesign"
              compareProjects={[
                { id: "p2", name: "Mobile App MVP", color: "#f59e0b" },
                { id: "p3", name: "API Integration", color: "#10b981" },
              ]}
            />
          </div>

          <div className="mt-8">
            <RiskBlockerDashboard />
          </div>

          <div className="mt-8">
            <MilestoneGantt />
          </div>

          <div className="mt-8">
            <SprintPlanning />
          </div>
        </>
      )}

      {/* Hidden Quick Task Modal controlled by other components if needed, or kept for consistency */}
      <QuickTaskModal
        open={addOpen}
        setOpen={setAddOpen}
        projectId={null}
        teamMembers={[]}
      />
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <ProjectsProvider>
      <ProjectsContent />
    </ProjectsProvider>
  );
}
