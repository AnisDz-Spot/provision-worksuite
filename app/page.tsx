import { AnalyticsWidgets } from "@/components/dashboard/AnalyticsWidgets";
import { ProjectTable } from "@/components/dashboard/ProjectTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ProjectsCharts } from "@/components/dashboard/ProjectsCharts";
import { TasksCharts } from "@/components/dashboard/TasksCharts";
import { TeamCharts } from "@/components/dashboard/TeamCharts";
import { WeeklyDigest } from "@/components/reports/WeeklyDigest";
// Note: Floating chat is handled by TeamChat in AppShell globally

export default function DashboardPage() {
  return (
    <>
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <AnalyticsWidgets />

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Projects Overview */}
          <div className="rounded-lg border border-border bg-card/50">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">
                Projects Overview
              </h2>
            </div>
            <div className="p-6">
              <ProjectsCharts />
            </div>
          </div>

          {/* Tasks Overview */}
          <div className="rounded-lg border border-border bg-card/50">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">
                Tasks Overview
              </h2>
            </div>
            <div className="p-6">
              <TasksCharts />
            </div>
          </div>

          {/* Team Overview */}
          <div className="rounded-lg border border-border bg-card/50">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">
                Team Overview
              </h2>
            </div>
            <div className="p-6">
              <TeamCharts />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2 flex flex-col gap-8">
            <ProjectTable />
          </div>
          <div className="flex flex-col gap-8">
            <RecentActivity />
          </div>
        </div>

        {/* Weekly Digest Section */}
        <WeeklyDigest />
      </section>
    </>
  );
}
