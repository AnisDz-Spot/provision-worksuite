"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  FolderKanban,
  UserCheck,
  CalendarClock,
} from "lucide-react";

export function AnalyticsWidgets() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedTasks: 0,
    activeUsers: 0,
    upcomingDeadlines: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const { loadProjects, loadTasks, loadUsers } =
          await import("@/lib/data");
        const [projects, tasks, users] = await Promise.all([
          loadProjects(),
          loadTasks(),
          loadUsers(),
        ]);

        // Calculate stats from real data
        const completedTasks = tasks.filter(
          (t: any) => t.status === "done" || t.status === "completed"
        ).length;
        const upcomingDeadlines = projects.filter((p: any) => {
          if (!p.deadline) return false;
          const deadline = new Date(p.deadline);
          const now = new Date();
          const daysUntil =
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysUntil > 0 && daysUntil <= 7;
        }).length;

        setStats({
          totalProjects: projects.length,
          completedTasks,
          activeUsers: users.length,
          upcomingDeadlines,
        });
      } catch (error) {
        console.error("Failed to load analytics:", error);
        // Keep default values (0)
      }
    }
    loadStats();
  }, []);

  const WIDGETS = [
    {
      label: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "from-indigo-500 to-purple-500",
      link: "/projects",
    },
    {
      label: "Completed Tasks",
      value: stats.completedTasks,
      icon: ClipboardList,
      color: "from-green-400 to-lime-500",
      link: "/tasks",
    },
    {
      label: "Active Users",
      value: stats.activeUsers,
      icon: UserCheck,
      color: "from-blue-400 to-cyan-500",
      link: "/team",
    },
    {
      label: "Upcoming Deadlines",
      value: stats.upcomingDeadlines,
      icon: CalendarClock,
      color: "from-orange-400 to-pink-500",
      link: "/calendar",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {WIDGETS.map(({ label, value, icon: Icon, color, link }, i) => (
        <motion.button
          whileHover={{ scale: 1.03 }}
          onClick={() => router.push(link)}
          className="flex flex-col rounded-xl shadow-md bg-card p-6 transition-all border border-border group hover:border-primary hover:shadow-lg cursor-pointer text-left"
          key={label}
        >
          <span
            className={`inline-flex items-center justify-center rounded-lg bg-linear-to-tr ${color} text-white w-10 h-10 mb-3`}
          >
            <Icon className="w-5 h-5" />
          </span>
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          <span className="text-muted-foreground text-sm mt-1">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}
