"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  FolderKanban,
  CheckSquare,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Settings,
  Clock,
  ArrowRight,
  Hash,
  AtSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { readProjects, readTasks } from "@/lib/utils";

type SearchResultType = "project" | "task" | "page" | "team" | "command";

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: React.ReactNode;
  keywords?: string[];
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Generate search results
  const allResults = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Pages/Commands
    const pages: SearchResult[] = [
      {
        id: "dashboard",
        type: "page",
        title: "Dashboard",
        subtitle: "Overview",
        url: "/",
        icon: <Hash className="w-4 h-4" />,
        keywords: ["home", "overview", "dashboard"],
      },
      {
        id: "projects",
        type: "page",
        title: "Projects",
        subtitle: "All Projects",
        url: "/projects",
        icon: <FolderKanban className="w-4 h-4" />,
        keywords: ["projects", "portfolio"],
      },
      {
        id: "tasks",
        type: "page",
        title: "Tasks",
        subtitle: "Task Management",
        url: "/tasks",
        icon: <CheckSquare className="w-4 h-4" />,
        keywords: ["tasks", "todos", "kanban"],
      },
      {
        id: "team",
        type: "page",
        title: "Team",
        subtitle: "Team Directory",
        url: "/team",
        icon: <Users className="w-4 h-4" />,
        keywords: ["team", "members", "people"],
      },
      {
        id: "calendar",
        type: "page",
        title: "Calendar",
        subtitle: "Schedule & Events",
        url: "/calendar",
        icon: <Calendar className="w-4 h-4" />,
        keywords: ["calendar", "schedule", "events"],
      },
      {
        id: "wiki",
        type: "page",
        title: "Wiki",
        subtitle: "Knowledge Base",
        url: "/wiki",
        icon: <FileText className="w-4 h-4" />,
        keywords: ["wiki", "docs", "documentation", "knowledge"],
      },
      {
        id: "finance",
        type: "page",
        title: "Finance",
        subtitle: "Budget & Reports",
        url: "/finance",
        icon: <DollarSign className="w-4 h-4" />,
        keywords: ["finance", "budget", "billing", "invoice"],
      },
      {
        id: "analytics",
        type: "page",
        title: "Analytics",
        subtitle: "Project Insights",
        url: "/analytics",
        icon: <Clock className="w-4 h-4" />,
        keywords: ["analytics", "metrics", "reports", "insights"],
      },
      {
        id: "reports",
        type: "page",
        title: "Reports",
        subtitle: "Custom Reports",
        url: "/reports",
        icon: <FileText className="w-4 h-4" />,
        keywords: ["reports", "export", "pdf"],
      },
      {
        id: "settings",
        type: "page",
        title: "Settings",
        subtitle: "Preferences",
        url: "/settings",
        icon: <Settings className="w-4 h-4" />,
        keywords: ["settings", "preferences", "config"],
      },
    ];

    results.push(...pages);

    // Projects
    try {
      const projects = readProjects();
      projects.forEach((project) => {
        if (!project.name) return;
        // Strip HTML tags from description
        const stripHtml = (html: string) => {
          const tmp = document.createElement("div");
          tmp.innerHTML = html;
          return tmp.textContent || tmp.innerText || "";
        };

        const cleanDescription =
          project.description && typeof project.description === "string"
            ? stripHtml(project.description)
            : typeof project.status === "string"
              ? project.status
              : "";

        results.push({
          id: `project-${project.id}`,
          type: "project",
          title: project.name,
          subtitle: "Project",
          description: cleanDescription || undefined,
          url: `/projects/${project.id}`,
          icon: <FolderKanban className="w-4 h-4 text-blue-600" />,
          keywords: [project.name, project.owner, project.status].filter(
            (k): k is string => typeof k === "string" && Boolean(k)
          ),
        });
      });
    } catch (e) {
      console.error("Error loading projects:", e);
    }

    // Tasks
    try {
      const tasks = readTasks();
      tasks.slice(0, 50).forEach((task) => {
        results.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          subtitle: "Task",
          description: `${task.status}${task.assignee ? ` • ${task.assignee}` : ""}`,
          url: `/tasks/${task.id}`,
          icon: <CheckSquare className="w-4 h-4 text-green-600" />,
          keywords: [task.title, task.status, task.assignee].filter(
            (k): k is string => Boolean(k)
          ),
        });
      });
    } catch (e) {
      console.error("Error loading tasks:", e);
    }

    // Quick Actions
    const quickActions: SearchResult[] = [
      {
        id: "new-project",
        type: "command",
        title: "Create New Project",
        subtitle: "Quick Action",
        url: "/projects/new",
        icon: <ArrowRight className="w-4 h-4 text-purple-600" />,
        keywords: ["new", "create", "project", "add"],
      },
      {
        id: "new-task",
        type: "command",
        title: "Create New Task",
        subtitle: "Quick Action",
        url: "/tasks",
        icon: <ArrowRight className="w-4 h-4 text-purple-600" />,
        keywords: ["new", "create", "task", "add"],
      },
    ];

    results.push(...quickActions);

    return results;
  }, []);

  // Filter results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return allResults.slice(0, 10);
    }

    const searchTerms = query.toLowerCase().split(" ");

    const scored = allResults
      .map((result) => {
        const searchableText = [
          result.title,
          result.subtitle,
          result.description,
          ...(result.keywords || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        let score = 0;

        // Exact match in title gets highest score
        if (result.title.toLowerCase().includes(query.toLowerCase())) {
          score += 100;
        }

        // Check each search term
        searchTerms.forEach((term) => {
          if (searchableText.includes(term)) {
            score += 10;
          }
          // Bonus for matches at start of words
          if (
            searchableText.includes(` ${term}`) ||
            searchableText.startsWith(term)
          ) {
            score += 5;
          }
        });

        return { result, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ result }) => result);

    return scored;
  }, [query, allResults]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredResults[selectedIndex]) {
            navigate(filteredResults[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigate = useCallback(
    (result: SearchResult) => {
      router.push(result.url);
      onClose();
      setQuery("");
    },
    [router, onClose]
  );

  const getTypeColor = (type: SearchResultType) => {
    switch (type) {
      case "project":
        return "bg-blue-500/10 text-blue-700";
      case "task":
        return "bg-green-500/10 text-green-700";
      case "team":
        return "bg-purple-500/10 text-purple-700";
      case "command":
        return "bg-orange-500/10 text-orange-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      size="full"
      className="p-0! overflow-hidden max-w-[60vw]!"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Search Input */}
        <div className="p-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, tasks, pages... or type a command"
              className="pl-14 pr-6 py-4 text-lg border-0 focus:ring-0"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredResults.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-base">
                {query ? "No results found" : "Start typing to search..."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => navigate(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left ${
                    index === selectedIndex
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className="shrink-0">{result.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-base truncate">
                        {result.title}
                      </span>
                      {result.subtitle && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getTypeColor(result.type)}`}
                        >
                          {result.subtitle}
                        </Badge>
                      )}
                    </div>
                    {result.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 bg-accent/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd>
                Close
              </span>
            </div>
            <span>{filteredResults.length} results</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Hook for global keyboard shortcut
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K on Mac, Ctrl+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}
