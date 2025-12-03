"use client";
import {
  HomeIcon,
  FolderKanbanIcon,
  ClipboardListIcon,
  UsersIcon,
  CalendarIcon,
  SettingsIcon,
  Rocket,
  BarChart3,
  BookOpen,
  MessageSquare,
  FileText,
  RotateCcw,
  DollarSign,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSettings } from "@/components/settings/SettingsProvider";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: any;
};

type NavGroup = {
  label: string;
  icon: any;
  items: NavItem[];
};

const navItems: (NavItem | NavGroup)[] = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/templates", label: "Templates", icon: Rocket },
  { href: "/tasks", label: "Tasks", icon: ClipboardListIcon },
  { href: "/team", label: "Team", icon: UsersIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon },
  {
    label: "Knowledge",
    icon: BookOpen,
    items: [
      { href: "/wiki", label: "Wiki", icon: BookOpen },
      { href: "/meetings", label: "Meetings", icon: MessageSquare },
      { href: "/decisions", label: "Decisions", icon: FileText },
      { href: "/retrospectives", label: "Retrospectives", icon: RotateCcw },
    ],
  },
  {
    label: "Insights",
    icon: BarChart3,
    items: [
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/reports", label: "Reports", icon: Download },
    ],
  },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const isNavGroup = (item: NavItem | NavGroup): item is NavGroup => {
  return "items" in item;
};

// Workspace name now comes from settings context

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const { workspace } = useSettings();
  const pathname = usePathname();
  const WORKSPACE_NAME = workspace.name;
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "Knowledge",
    "Insights",
  ]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const isActiveInGroup = (items: NavItem[]) => {
    return items.some((item) => pathname === item.href);
  };

  return (
    <aside
      className={cn(
        // Main sidebar with dark mode dark-blue color
        "fixed left-0 top-0 h-screen border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col bg-sidebar dark:bg-[#111743] z-30",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <Link
        href="/"
        className={cn(
          "flex items-center h-16 px-3 gap-3 font-bold text-lg tracking-tight group relative cursor-pointer hover:opacity-80 transition-opacity"
        )}
        title={!collapsed ? undefined : WORKSPACE_NAME}
      >
        <span className="inline-flex items-center justify-center">
          {workspace.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={workspace.logoDataUrl}
              alt={WORKSPACE_NAME + " Logo"}
              className={cn(
                "rounded-full bg-white dark:bg-slate-700 p-1 w-10 h-10 object-contain",
                collapsed ? "" : ""
              )}
            />
          ) : (
            <Image
              src="/provision-logo.png"
              alt="ProVision Logo"
              width={36}
              height={36}
              priority
              className={cn(
                "rounded-full bg-white dark:bg-slate-700 p-1",
                collapsed ? "" : ""
              )}
            />
          )}
        </span>
        {!collapsed && (
          <span className="truncate select-none">{WORKSPACE_NAME}</span>
        )}
        {/* Tooltip on logo hover when collapsed */}
        {collapsed && (
          <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-muted text-foreground py-1 px-3 rounded shadow text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition">
            {WORKSPACE_NAME}
          </span>
        )}
      </Link>
      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 px-2 mt-2 pb-2">
          {navItems.map((item) => {
            if (isNavGroup(item)) {
              const isExpanded = expandedGroups.includes(item.label);
              const hasActive = isActiveInGroup(item.items);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "w-full flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors text-sm",
                      collapsed ? "justify-center" : "justify-between",
                      hasActive
                        ? "bg-primary/5 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon
                        className={cn(
                          "transition-all",
                          collapsed ? "w-6 h-6" : "w-4 h-4"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>
                    {!collapsed &&
                      (isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      ))}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.items.map((subItem) => {
                        const isActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={cn(
                              "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors text-sm",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span className="truncate">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <div key={item.href} className="relative group w-full">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 py-1.5 px-2 rounded-lg transition-colors text-sm",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "transition-all",
                        collapsed ? "w-6 h-6" : "w-4 h-4"
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                  {collapsed && (
                    <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-muted text-foreground py-1 px-3 rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-10">
                      {item.label}
                    </span>
                  )}
                </div>
              );
            }
          })}
        </nav>
      </div>
      <button
        className={cn(
          "mt-auto mb-4 px-3 py-2 rounded-lg bg-sidebar-accent/20 hover:bg-sidebar-accent transition-colors flex items-center gap-2 cursor-pointer",
          collapsed ? "mx-auto" : "ml-2 mr-auto"
        )}
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Collapse sidebar"
        title={collapsed ? "Expand" : "Minimize"}
      >
        <svg
          width="20"
          height="20"
          className={cn("transition-transform", collapsed && "rotate-180")}
        >
          <path
            d="M8 4l8 8-8 8"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        {!collapsed && (
          <span className="text-sm font-medium whitespace-nowrap">
            Minimize
          </span>
        )}
      </button>
    </aside>
  );
}
