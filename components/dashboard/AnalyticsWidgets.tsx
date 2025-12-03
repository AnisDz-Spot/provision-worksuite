"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FolderKanban,
  UserCheck,
  CalendarClock,
} from "lucide-react";

const WIDGETS = [
  {
    label: "Total Projects",
    value: 12,
    icon: FolderKanban,
    color: "from-indigo-500 to-purple-500",
    link: "/projects",
  },
  {
    label: "Completed Tasks",
    value: 324,
    icon: ClipboardList,
    color: "from-green-400 to-lime-500",
    link: "/tasks",
  },
  {
    label: "Active Users",
    value: 22,
    icon: UserCheck,
    color: "from-blue-400 to-cyan-500",
    link: "/team",
  },
  {
    label: "Upcoming Deadlines",
    value: 7,
    icon: CalendarClock,
    color: "from-orange-400 to-pink-500",
    link: "/calendar",
  },
];

export function AnalyticsWidgets() {
  const router = useRouter();

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
