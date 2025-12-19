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
  Menu,
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
  { href: "/chat", label: "Messages", icon: MessageSquare },
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

export function Sidebar({ canNavigate = true }: { canNavigate?: boolean }) {
  const { collapsed, setCollapsed } = useSidebar();
  const { workspace } = useSettings();
  const pathname = usePathname();
  const WORKSPACE_NAME = workspace.name;
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  // Submenus are collapsed by default - user must click to expand

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
        "fixed left-0 top-0 h-screen border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col bg-sidebar dark:bg-[#111743] z-40 overflow-hidden",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "flex items-center h-16 px-3 gap-3 font-bold text-lg tracking-tight hover:bg-sidebar-accent/50 transition-all cursor-pointer w-full",
          collapsed && "justify-center"
        )}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="inline-flex items-center justify-center">
          <Menu className="w-6 h-6" />
        </span>
        {!collapsed && (
          <span className="truncate select-none">{WORKSPACE_NAME}</span>
        )}
      </button>
      {/* Scrollable nav area */}
      <div
        className={cn(
          "flex-1 overflow-y-auto scrollbar-hide",
          collapsed ? "" : "overflow-x-hidden"
        )}
      >
        <nav
          className={cn(
            "flex flex-col mt-4 pb-2",
            collapsed ? "gap-3 px-3" : "gap-4 px-2"
          )}
        >
          {canNavigate ? (
            navItems.map((item) => {
              if (isNavGroup(item)) {
                const isExpanded = expandedGroups.includes(item.label);
                const hasActive = isActiveInGroup(item.items);
                return (
                  <div key={item.label} className="relative group">
                    <button
                      onClick={() => toggleGroup(item.label)}
                      className={cn(
                        "w-full flex items-center gap-2 py-2.5 px-2 rounded-lg transition-all duration-200 text-sm hover:translate-x-1",
                        collapsed ? "justify-center" : "justify-between",
                        hasActive
                          ? "bg-primary/5 text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                      disabled={!canNavigate}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon
                          className={cn(
                            "transition-all shrink-0",
                            collapsed ? "w-5 h-5" : "w-4 h-4"
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
                              href={canNavigate ? subItem.href : "#"}
                              className={cn(
                                "flex items-center gap-2 py-2.5 px-2 rounded-lg transition-all duration-200 text-sm hover:translate-x-1",
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-sidebar-foreground",
                                !canNavigate && "opacity-50 pointer-events-none"
                              )}
                              tabIndex={canNavigate ? 0 : -1}
                              title={collapsed ? subItem.label : undefined}
                            >
                              <subItem.icon className="w-4 h-4 shrink-0" />
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
                      href={canNavigate ? item.href : "#"}
                      className={cn(
                        "flex items-center gap-2 py-2.5 px-2 rounded-lg transition-all duration-200 text-sm hover:translate-x-1",
                        collapsed ? "justify-center" : "",
                        isActive
                          ? "bg-primary/10 dark:bg-primary/20 text-primary border-l-4 border-primary font-medium"
                          : "text-sidebar-foreground",
                        !canNavigate && "opacity-50 pointer-events-none"
                      )}
                      tabIndex={canNavigate ? 0 : -1}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        className={cn(
                          "transition-all shrink-0",
                          collapsed ? "w-5 h-5" : "w-4 h-4"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </div>
                );
              }
            })
          ) : (
            <div className="text-xs text-muted-foreground px-2 py-4">
              Please select a mode to unlock navigation.
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
