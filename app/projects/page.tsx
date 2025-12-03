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
import { Button } from "@/components/ui/Button";
import {
  FolderKanbanIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  Upload,
  TrendingUp,
  GanttChartIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { getProjectDependencies } from "@/lib/utils";

export default function ProjectsPage() {
  const [view, setView] = useState<"grid" | "list" | "gantt">("grid");
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("pv:projectsView");
    if (saved === "list" || saved === "grid" || saved === "gantt") {
      setView(saved);
    }
    // Load projects for Gantt chart
    try {
      const raw = localStorage.getItem("pv:projects");
      const arr = raw ? JSON.parse(raw) : [];
      setProjects(Array.isArray(arr) ? arr : []);
    } catch {}
  }, []);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    thumbnail: "",
    description: "",
    priority: "medium",
    status: "In Progress",
    deadline: "",
    privacy: "team",
    categories: "",
    tags: "",
    members: "",
    files: [] as File[],
  });
  return (
    <section className="p-4 md:p-8 flex flex-col gap-8">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <Button
            variant={view === "grid" ? "primary" : "outline"}
            onClick={() => {
              setView("grid");
              localStorage.setItem("pv:projectsView", "grid");
            }}
            title="Grid view"
            className="cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "list" ? "primary" : "outline"}
            onClick={() => {
              setView("list");
              localStorage.setItem("pv:projectsView", "list");
            }}
            title="List view"
            className="cursor-pointer"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={view === "gantt" ? "primary" : "outline"}
            onClick={() => {
              setView("gantt");
              localStorage.setItem("pv:projectsView", "gantt");
            }}
            title="Timeline view"
            className="cursor-pointer"
          >
            <GanttChartIcon className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Timeline</span>
          </Button>
          <Button variant="primary" asChild>
            <a href="/projects/new">+ New Project</a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Completed Projects Card */}
        <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Completed
                </p>
                <p className="text-4xl font-bold text-green-600">1</p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+25% from last month</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            {/* Mini bar chart */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-8">Nov</div>
                <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500/60 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-8">Dec</div>
                <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Projects Card */}
        <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Active
                </p>
                <p className="text-4xl font-bold text-blue-600">2</p>
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>On track</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            {/* Mini progress rings */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-accent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-blue-500"
                    strokeDasharray="126"
                    strokeDashoffset="38"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                  70%
                </div>
              </div>
              <div className="relative">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-accent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-blue-500"
                    strokeDasharray="126"
                    strokeDashoffset="63"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
                  50%
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Avg progress</div>
            </div>
          </div>
        </Card>

        {/* Paused Projects Card */}
        <Card className="p-6 relative overflow-hidden group hover:shadow-xl transition-all">
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Paused
                </p>
                <p className="text-4xl font-bold text-amber-600">1</p>
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Needs attention</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            {/* Mini timeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="text-xs text-muted-foreground">
                  Project Gamma paused
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="text-xs text-muted-foreground">
                  Awaiting review
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="text-xs text-muted-foreground">
                  Team reassignment
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {view === "gantt" ? (
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

      {/* Removed modal; new project has a dedicated page */}
    </section>
  );
}
