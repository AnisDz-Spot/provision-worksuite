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
        const res = await fetch("/api/analytics/activities", {
          cache: "no-store",
        });
        const result = await res.json();

        if (result.success && result.data) {
          const { tasks, projects } = result.data;
          const recentActivities: Activity[] = [];

          // Map Tasks
          tasks.forEach((task: any, idx: number) => {
            recentActivities.push({
              id: `task_${task.id}`,
              who: task.assignee?.name || "Someone",
              action:
                task.status === "done" || task.status === "completed"
                  ? `completed task ${task.title}`
                  : `updated task ${task.title}`,
              when: idx === 0 ? "Just now" : idx === 1 ? "15m ago" : "2h ago", // Fallback for time
              link: `/tasks/${task.id}`,
              type: "task",
            });
          });

          // Map Projects
          projects.forEach((project: any, idx: number) => {
            recentActivities.push({
              id: `project_${project.id}`,
              who: project.user?.name || "Admin",
              action: `created ${project.name}`,
              when: idx === 0 ? "3h ago" : "Yesterday",
              link: `/projects/${project.id}`,
              type: "project",
            });
          });

          setActivities(recentActivities.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to load activities:", error);
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
