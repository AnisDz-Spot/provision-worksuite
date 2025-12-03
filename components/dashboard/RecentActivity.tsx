"use client";
import { useRouter } from "next/navigation";
import { ActivitySquare } from "lucide-react";

type Activity = {
  id: string;
  who: string;
  action: string;
  when: string;
  link?: string;
  type?: "project" | "task" | "user";
};

const ACTIVITIES: Activity[] = [
  {
    id: "1",
    who: "Alice",
    action: "created Project Delta",
    when: "7 min ago",
    link: "/projects/p4",
    type: "project",
  },
  {
    id: "2",
    who: "David",
    action: "completed task Setup Auth",
    when: "55 min ago",
    link: "/tasks/task3",
    type: "task",
  },
  {
    id: "3",
    who: "Carol",
    action: "updated Project Gamma",
    when: "2 hrs ago",
    link: "/projects/p3",
    type: "project",
  },
  {
    id: "4",
    who: "Bob",
    action: "added new member: Erin",
    when: "yesterday",
    type: "user",
  },
];

export function RecentActivity() {
  const router = useRouter();

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
      <ul className="flex flex-col gap-5">
        {ACTIVITIES.map((activity) => (
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
                className={activity.link ? "text-blue-500 hover:underline" : ""}
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
    </div>
  );
}
