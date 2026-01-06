"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardList,
  FolderKanban,
  UserCheck,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

import { fetchWithCsrf } from "@/lib/csrf-client";
import { useLoading } from "@/context/LoadingContext";

export function AnalyticsWidgets() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProjects: { current: 0, total: 0, trend: [] as number[] },
    completedTasks: { current: 0, total: 0, trend: [] as number[] },
    activeUsers: { current: 0, total: 0, trend: [] as number[] },
    upcomingDeadlines: { current: 0, total: 0, trend: [] as number[] },
  });

  const { showLoader, hideLoader } = useLoading();

  useEffect(() => {
    async function loadStats() {
      showLoader("Loading dashboard metrics...");
      try {
        const res = await fetchWithCsrf("/api/analytics/stats", {
          cache: "no-store",
        });
        const result = await res.json();

        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        hideLoader();
      }
    }
    loadStats();
  }, []);

  const WIDGETS = [
    {
      label: "Total Projects",
      value: `${stats.totalProjects.current}/${stats.totalProjects.total}`,
      trend: stats.totalProjects.trend,
      icon: FolderKanban,
      color: "from-indigo-500 to-purple-500",
      stroke: "#818cf8",
      fill: "#c7d2fe",
      link: "/projects",
    },
    {
      label: "Completed Tasks",
      value: `${stats.completedTasks.current}/${stats.completedTasks.total}`,
      trend: stats.completedTasks.trend,
      icon: ClipboardList,
      color: "from-green-400 to-lime-500",
      stroke: "#4ade80",
      fill: "#bcfebc",
      link: "/tasks",
    },
    {
      label: "Active Users",
      value: `${stats.activeUsers.current}/${stats.activeUsers.total}`,
      trend: stats.activeUsers.trend,
      icon: UserCheck,
      color: "from-blue-400 to-cyan-500",
      stroke: "#60a5fa",
      fill: "#bee3f8",
      link: "/team",
    },
    {
      label: "Upcoming Deadlines",
      value: `${stats.upcomingDeadlines.current}/${stats.upcomingDeadlines.total}`,
      trend: stats.upcomingDeadlines.trend,
      icon: CalendarClock,
      color: "from-orange-400 to-pink-500",
      stroke: "#fb923c",
      fill: "#ffedd5",
      link: "/calendar",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {WIDGETS.map(
        ({ label, value, trend, icon: Icon, color, stroke, fill, link }, i) => (
          <motion.button
            whileHover={{ scale: 1.03 }}
            onClick={() => router.push(link)}
            className="relative flex flex-col rounded-xl shadow-md bg-card p-6 transition-all border border-border group hover:border-primary hover:shadow-lg cursor-pointer text-left overflow-hidden"
            key={label}
          >
            <div className="relative z-10">
              <span
                className={`inline-flex items-center justify-center rounded-lg bg-linear-to-tr ${color} text-white w-10 h-10 mb-3`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">
                  {value.split("/")[0]}
                </span>
                <span className="text-muted-foreground text-sm font-medium">
                  / {value.split("/")[1]}
                </span>
              </div>
              <span className="text-muted-foreground text-xs uppercase font-semibold tracking-wider mt-1 block">
                {label}
              </span>
            </div>

            {/* Sparkline Chart */}
            <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend?.map((v, idx) => ({ value: v, idx }))}>
                  <defs>
                    <linearGradient
                      id={`gradient-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={stroke} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={stroke}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#gradient-${i})`}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.button>
        )
      )}
    </div>
  );
}
