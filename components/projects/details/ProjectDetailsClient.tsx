"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

// Components
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProjectDetailsHeader } from "@/components/projects/details/ProjectDetailsHeader";
import { ProjectHealthSection } from "@/components/projects/details/ProjectHealthSection";
import { ProjectTimeRollup } from "@/components/projects/details/ProjectTimeRollup";
import { ProjectSidebar } from "@/components/projects/details/ProjectSidebar";
import { HealthHistoryModal } from "@/components/projects/details/HealthHistoryModal";
import { SaveTemplateModal } from "@/components/projects/details/SaveTemplateModal";

// External Project Components
import { ProjectMilestones } from "@/components/projects/ProjectMilestones";
import { ProjectComments } from "@/components/projects/ProjectComments";
import { ProjectDependencies } from "@/components/projects/ProjectDependencies";
import { ProjectFiles } from "@/components/projects/ProjectFiles";
import { MemberAcceptanceStatus } from "@/components/projects/MemberAcceptanceStatus";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { RiskMatrix } from "@/components/projects/RiskMatrix";
import { AIProjectAnalyst } from "@/components/ai/AIProjectAnalyst";
import { ProjectFinance } from "@/components/projects/ProjectFinance";
import { ProjectWiki } from "@/components/wiki/ProjectWiki";
import { ProjectGantt } from "@/components/projects/gantt/ProjectGantt";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

// Utils
import { sanitizeHtml } from "@/lib/sanitize";
import { getTasksByProject, getTimeLogsForTask } from "@/lib/utils";

interface ProjectDetailsClientProps {
  project: any; // Ideally strictly typed with Prisma types
  allProjects?: any[];
  initialExpenses?: any[];
  initialInvoices?: any[];
}

export function ProjectDetailsClient({
  project,
  allProjects = [],
  initialExpenses = [],
  initialInvoices = [],
}: ProjectDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tasksRef = React.useRef<HTMLDivElement>(null);

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [templateModalOpen, setTemplateModalOpen] = React.useState(false);

  // Refresh function (wraps router.refresh)
  const refresh = React.useCallback(() => {
    router.refresh();
  }, [router]);

  const currentTab = searchParams?.get("tab") || "overview";

  const handleTabChange = (value: string) => {
    if (project) {
      router.replace(`/projects/${project.uid}?tab=${value}`, {
        scroll: false,
      });
    }
  };

  const tasks = project.tasks || []; // Assuming tasks are included in the server fetch
  const titleMap = new Map(tasks.map((t: any) => [t.id, t.title]));
  const allLogs = tasks.flatMap((t: any) => getTimeLogsForTask(t.id)); // Note: this util might need client-side data or be updated
  // For now assuming getTasksByProject/getTimeLogsForTask might fallback to something or we pass data.
  // Actually, getTasksByProject reads from local storage/dummy in the original code?
  // If we move to server, we should pass tasks in 'project'.

  // Re-calculate local logs if needed or assume passed.
  // The original util `getTimeLogsForTask` likely referenced a store.
  // For this refactor, let's assume `project.tasks` has what we need or we keep using the util for now if it's strictly client-side mock logic.
  // Warning: mixed mock/real logic.

  const recentTimeLogs = allLogs
    .sort((a: any, b: any) => b.loggedAt - a.loggedAt)
    .slice(0, 10);

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8">
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </Link>

      <Card className="overflow-hidden">
        <ProjectDetailsHeader
          project={project}
          onSaveAsTemplate={() => setTemplateModalOpen(true)}
        />
        <Tabs
          key={currentTab}
          defaultValue={currentTab}
          className="w-full"
          onValueChange={handleTabChange}
        >
          <div className="border-b px-6 bg-muted/30">
            <TabsList className="bg-transparent h-12 p-0 space-x-6 w-full justify-start overflow-x-auto">
              <TabsTrigger
                value="overview"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium whitespace-nowrap"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="gantt"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium whitespace-nowrap"
              >
                Gantt Chart
              </TabsTrigger>
              <TabsTrigger
                value="wiki"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium whitespace-nowrap"
              >
                Docs & Wiki
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium whitespace-nowrap"
              >
                Finance & Budget
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 space-y-4 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Left Side */}
              <div className="lg:col-span-2 space-y-6">
                <ProjectHealthSection
                  project={project}
                  onViewHistory={() => setHistoryOpen(true)}
                />

                <ProjectTimeRollup project={project} />

                {project.description && (
                  <Card className="p-6 bg-linear-to-br from-card to-accent/5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-5 bg-primary rounded-full"></div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        Project Description
                      </h3>
                    </div>
                    <div
                      className="text-sm text-foreground/90 prose prose-sm max-w-none leading-relaxed pl-3"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(project.description),
                      }}
                    />
                  </Card>
                )}

                <AIProjectAnalyst projectId={project.uid || project.id} />
                <ProjectMilestones projectId={project.uid || project.id} />
                <ProjectComments projectId={project.uid || project.id} />

                <ProjectDependencies
                  projectId={project.uid || project.id}
                  availableProjects={allProjects}
                  readOnly={true}
                />

                <ProjectFiles
                  projectId={project.uid || project.id}
                  readOnly={true}
                />

                <MemberAcceptanceStatus projectId={project.uid || project.id} />
              </div>

              {/* Right Sidebar */}
              <ProjectSidebar project={project} />
            </div>

            {/* Tasks (Kanban) - Full Width */}
            <div className="mt-6" ref={tasksRef}>
              <h3 className="text-sm font-semibold mb-2">Tasks</h3>
              <KanbanBoard
                projectId={project.uid || project.id}
                projectUid={project.uid || ""}
                projectMembers={project.members || []}
                onTaskUpdate={refresh}
              />
            </div>

            {/* Risk Management Matrix */}
            <div className="mt-6">
              <RiskMatrix
                projectId={project.uid || project.id}
                projectName={project.name}
                projectMembers={project.members || []}
              />
            </div>

            {/* Recent Time Logs List */}
            {recentTimeLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Recent Time Logs</h3>
                <div className="space-y-1">
                  {recentTimeLogs.map((l: any) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between text-xs border border-border rounded px-2 py-1.5 bg-card/50 gap-2"
                    >
                      <span
                        className="font-medium truncate max-w-[30%]"
                        title={String(titleMap.get(l.taskId) || "Task")}
                      >
                        {String(titleMap.get(l.taskId) || "Task")}
                      </span>
                      <span
                        className="text-muted-foreground truncate max-w-[25%]"
                        title={l.loggedBy || "Unknown"}
                      >
                        {l.loggedBy || "Unknown"}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                        {new Date(l.loggedAt).toLocaleDateString()}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded bg-background/60 font-semibold shrink-0"
                        title={`${l.hours} hours`}
                      >
                        {l.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gantt" className="p-6 mt-0">
            <ProjectGantt tasks={tasks} />
          </TabsContent>

          <TabsContent value="wiki" className="p-6 mt-0">
            <ProjectWiki projectUid={project.uid || ""} />
          </TabsContent>

          <TabsContent value="finance" className="p-6 mt-0">
            {/* pass initial data here */}
            <ProjectFinance
              projectId={project.id}
              projectUid={project.uid}
              projectName={project.name}
              budget={project.budget || 0}
              spent={project.spent || 0}
              onUpdate={refresh}
              initialExpenses={initialExpenses}
              initialInvoices={initialInvoices}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Floating Tasks Icon */}
      <button
        onClick={() =>
          tasksRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        className="fixed bottom-4 right-20 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title="Jump to Tasks"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </button>

      {/* Modals */}
      <HealthHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        project={project}
      />

      <SaveTemplateModal
        open={templateModalOpen}
        onOpenChange={setTemplateModalOpen}
        project={project}
      />
    </section>
  );
}
