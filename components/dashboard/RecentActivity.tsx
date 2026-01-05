"use client";
import { useRouter } from "next/navigation";
import { ActivitySquare } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchWithCsrf } from "@/lib/csrf-client";

type Activity = {
  id: string;
  who: string;
  action: string;
  when: string;
  createdAt: string;
  link?: string;
  type?: "project" | "task" | "user";
};

export function RecentActivity() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetchWithCsrf("/api/analytics/activities", {
          cache: "no-store",
        });
        const result = await res.json();

        if (result.success && result.data) {
          const { tasks, projects } = result.data;
          const recentActivities: Activity[] = [];

          // Helper for relative time
          const timeAgo = (dateStr: string) => {
            if (!dateStr) return "";
            const date = new Date(dateStr);
            const now = new Date();
            const diffInSeconds = Math.floor(
              (now.getTime() - date.getTime()) / 1000
            );

            if (diffInSeconds < 60) return "Just now";
            if (diffInSeconds < 3600)
              return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400)
              return `${Math.floor(diffInSeconds / 3600)}h ago`;
            if (diffInSeconds < 604800)
              return `${Math.floor(diffInSeconds / 86400)}d ago`;
            return date.toLocaleDateString();
          };

          // Map Tasks
          tasks.forEach((task: any) => {
            recentActivities.push({
              id: `task_${task.id}`,
              who: task.assignee?.name || "Someone",
              action:
                task.status === "done" || task.status === "completed"
                  ? `completed task ${task.title}`
                  : `updated task ${task.title}`,
              when: timeAgo(task.createdAt),
              createdAt: task.createdAt,
              link: `/tasks/${task.id}`,
              type: "task",
            });
          });

          // Map Projects
          projects.forEach((project: any) => {
            recentActivities.push({
              id: `project_${project.id}`,
              who: project.user?.name || "Admin",
              action: `created ${project.name}`,
              when: timeAgo(project.createdAt),
              createdAt: project.createdAt,
              link: `/projects/${project.id}`,
              type: "project",
            });
          });

          // Sort by date descending
          recentActivities.sort((a, b) => {
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
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
