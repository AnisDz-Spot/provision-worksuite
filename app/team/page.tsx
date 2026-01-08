"use client";
import { Users, BarChart3, LayoutGrid, List, Activity } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TeamTable } from "@/components/team/TeamTable";
import { TeamCards } from "@/components/team/TeamCards";
import { MemberWorkloadView } from "@/components/team/MemberWorkloadView";
import { MemberWorkload } from "@/components/team/MemberWorkload";
import { IndividualContributionStats } from "@/components/team/IndividualContributionStats";
import { ActivityHeatmap } from "@/components/team/ActivityHeatmap";
import { MemberAvailabilityCalendar } from "@/components/team/MemberAvailabilityCalendar";
import {
  ActivityFeed,
  type ActivityItem,
} from "@/components/team/ActivityFeed";
import { useState, useCallback, useMemo, useEffect } from "react";
import { readProjects, readTasks } from "@/lib/utils";
import { useRevalidatedData } from "@/hooks/useRevalidatedData";
import { loadProjects, loadTasks } from "@/lib/data";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TeamPage() {
  const [addMemberFn, setAddMemberFn] = useState<(() => void) | null>(null);
  const [activeSection, setActiveSection] = useState<
    "directory" | "analytics" | "activity"
  >("directory");
  const [directoryView, setDirectoryView] = useState<"table" | "cards">(
    "table"
  );
  const [chatTarget, setChatTarget] = useState<string | null>(null);

  const handleAddClick = useCallback((fn: () => void) => {
    setAddMemberFn(() => fn);
  }, []);

  const handleChatClick = useCallback((memberName: string) => {
    // The chat is handled globally in layout, we just trigger it
    // For now, we'll use a custom event to communicate with TeamChat
    window.dispatchEvent(
      new CustomEvent("openTeamChat", { detail: { memberName } })
    );
  }, []);

  // Use revalidated data for activity feed
  const { data: allProjects, loading: isLoadingProjects } = useRevalidatedData<
    any[]
  >(loadProjects, { persistKey: "projects" });
  const { data: allTasks, loading: isLoadingTasks } = useRevalidatedData<any[]>(
    loadTasks,
    { persistKey: "tasks" }
  );

  const activities = useMemo(() => {
    if (!allProjects || !allTasks) return [];

    const liveActivities: ActivityItem[] = [];

    // Generate activities from tasks
    allTasks.slice(0, 20).forEach((task: any) => {
      const project = allProjects.find(
        (p: any) => (p.id || p.uid) === (task.project_id || task.projectId)
      );
      liveActivities.push({
        id: `activity_${task.uid || task.id}`,
        type: task.status === "done" ? "task_completed" : "task_created",
        user: task.assignee?.name || task.assignee || "Unknown",
        userAvatar:
          task.assignee?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee?.name || task.assignee || "Unknown"}`,
        action: task.status === "done" ? "completed" : "created",
        target: task.title,
        projectName: project?.name,
        timestamp: new Date(
          task.updated_at || task.created_at || Date.now()
        ).getTime(),
      });
    });

    // Generate activities from projects
    allProjects.slice(0, 5).forEach((project: any) => {
      liveActivities.push({
        id: `activity_project_${project.id || project.uid}`,
        type: "project_created",
        user: "Admin",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
        action: "created project",
        target: project.name,
        timestamp: new Date(project.created_at || Date.now()).getTime(),
      });
    });

    return liveActivities.sort((a, b) => b.timestamp - a.timestamp);
  }, [allProjects, allTasks]);

  const isLoadingActivity = isLoadingProjects || isLoadingTasks;

  return (
    <section className="p-4 md:p-8 flex flex-col gap-6">
      {/* Header with Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Team
          </h1>
          {activeSection === "directory" && (
            <Button onClick={() => addMemberFn?.()}>+ Add Member</Button>
          )}
        </div>

        {/* Section Navigation */}
        <div className="flex items-center gap-2 border-b pb-2">
          <button
            onClick={() => setActiveSection("directory")}
            className={`flex items-center gap-2 px-4 py-2 rounded-t transition-colors cursor-pointer ${
              activeSection === "directory"
                ? "bg-primary/10 dark:bg-primary/20 text-primary border-b-2 border-primary font-medium"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Users className="w-4 h-4" />
            Team Directory
          </button>
          <button
            onClick={() => setActiveSection("analytics")}
            className={`flex items-center gap-2 px-4 py-2 rounded-t transition-colors cursor-pointer ${
              activeSection === "analytics"
                ? "bg-primary/10 dark:bg-primary/20 text-primary border-b-2 border-primary font-medium"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Team Analytics
          </button>
          <button
            onClick={() => setActiveSection("activity")}
            className={`flex items-center gap-2 px-4 py-2 rounded-t transition-colors cursor-pointer ${
              activeSection === "activity"
                ? "bg-primary/10 dark:bg-primary/20 text-primary border-b-2 border-primary font-medium"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Activity className="w-4 h-4" />
            Team Activity
          </button>
        </div>

        {/* Directory View Switcher */}
        {activeSection === "directory" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">View:</span>
            <button
              onClick={() => setDirectoryView("table")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                directoryView === "table"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setDirectoryView("cards")}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors cursor-pointer ${
                directoryView === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary hover:bg-secondary/80"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeSection === "directory" ? (
        directoryView === "table" ? (
          <TeamTable
            onAddClick={handleAddClick}
            onChatClick={handleChatClick}
          />
        ) : (
          <TeamCards
            onAddClick={handleAddClick}
            onChatClick={handleChatClick}
          />
        )
      ) : activeSection === "activity" ? (
        isLoadingActivity ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <ActivityFeed activities={activities} />
        )
      ) : (
        <div className="space-y-6">
          {/* Enhanced Member Workload Dashboard */}
          <MemberWorkload />

          {/* Original Member Workload View */}
          <MemberWorkloadView />

          {/* Activity Heatmap and Contribution Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ActivityHeatmap days={30} />
            <IndividualContributionStats />
          </div>

          {/* Availability Calendar */}
          <MemberAvailabilityCalendar />
        </div>
      )}
    </section>
  );
}
