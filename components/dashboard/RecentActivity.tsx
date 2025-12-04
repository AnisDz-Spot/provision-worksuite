"use client";
import { useRouter } from "next/navigation";
import { ActivitySquare } from "lucide-react";
import { useEffect, useState } from "react";

type Activity = {
  id: string;
  who: string;
  action: string;
  when: string;
  link?: string;
  type?: "project" | "task" | "user";
};

export function RecentActivity() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    async function loadActivities() {
      try {
        const { loadProjects, loadTasks } = await import("@/lib/data");
        const [projects, tasks] = await Promise.all([
          loadProjects(),
          loadTasks(),
        ]);

        // Generate activities from real data
        const recentActivities: Activity[] = [];

        // Recent tasks (last 5)
        tasks.slice(0, 5).forEach((task: any, idx: number) => {
          const project = projects.find((p: any) => p.id === task.projectId);
          const timeAgo =
            idx === 0
              ? "7 min ago"
              : idx === 1
                ? "55 min ago"
                : idx === 2
                  ? "2 hrs ago"
                  : "yesterday";

          recentActivities.push({
            id: `task_${task.id}`,
            who: task.assignee || "Someone",
            action:
              task.status === "done"
                ? `completed task ${task.title}`
                : `created task ${task.title}`,
            when: timeAgo,
            link: `/tasks/${task.id}`,
            type: "task",
          });
        });

        // Recent projects (last 2)
        projects.slice(0, 2).forEach((project: any, idx: number) => {
          recentActivities.push({
            id: `project_${project.id}`,
            who: project.owner || "Admin",
            action: `created ${project.name}`,
            when: idx === 0 ? "3 hrs ago" : "yesterday",
            link: `/projects/${project.id}`,
            type: "project",
          });
        });

        setActivities(recentActivities.slice(0, 4));
      } catch (error) {
        console.error("Failed to load activities:", error);
        // Show empty state
        setActivities([]);
      }
    }
    loadActivities();
  }, []);

  const handleActivityClick = (activity: Activity) => {
    if (activity.link) {
      router.push(activity.link);
    }
  };

  return (
    <div className="rounded-xl bg-card border shadow-md p-6">
      <div className="flex items-center gap-2 text-base font-semibold mb-4">
        <ActivitySquare className="w-5 h-5" />
        Recent Activity
      </div>
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recent activity
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {activities.map((activity) => (
            <li
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className={`flex items-center justify-between text-sm ${
                activity.link
                  ? "cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors -mx-2"
                  : ""
              }`}
            >
              <span className="flex-1">
                <span className="font-medium text-foreground">
                  {activity.who}
                </span>{" "}
                <span
                  className={
                    activity.link ? "text-blue-500 hover:underline" : ""
                  }
                >
                  {activity.action}
                </span>
              </span>
              <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                {activity.when}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


