"use client";
import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Star, MoreVertical } from "lucide-react";
import {
  logProjectEvent,
  getSavedViews,
  saveView,
  deleteSavedView,
  SavedView,
  calculateProjectHealth,
  getProjectFiles,
  getTaskCompletionForProject,
  snapshotHealth,
  getHealthSeries,
  upsertTask,
  getMilestonesByProject,
} from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

type Project = {
  id: string;
  uid?: string;
  slug?: string;
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string;
  priority?: "low" | "medium" | "high";
  starred?: boolean;
  members?: any[]; // Allow flexibility for API response
  cover?: string;
  tags?: string[];
  isTemplate?: boolean;
  archived?: boolean;
  category?: string;
  categories?: string[];
  client?: string;
};

export function ProjectGrid() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { showToast } = useToast();

  const [query, setQuery] = React.useState(searchParams.get("query") || "");
  const [status, setStatus] = React.useState(
    searchParams.get("status") || "all"
  );
  const [sortBy, setSortBy] = React.useState(
    searchParams.get("sort") || "name-asc"
  );
  const [starredOnly, setStarredOnly] = React.useState(
    searchParams.get("starred") === "true"
  );
  const [clientFilter, setClientFilter] = React.useState(
    searchParams.get("client") || "all"
  );
  const [categoryFilter, setCategoryFilter] = React.useState(
    searchParams.get("category") || "all"
  );
  const [tagFilter, setTagFilter] = React.useState(
    searchParams.get("tag") || "all"
  );

  const [currentPage, setCurrentPage] = React.useState(
    parseInt(searchParams.get("page") || "1")
  );
  const itemsPerPage = 9;

  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");
  const [savedViews, setSavedViews] = React.useState<SavedView[]>([]);
  const [viewName, setViewName] = React.useState("");
  const [showSaveView, setShowSaveView] = React.useState(false);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [addForProject, setAddForProject] = React.useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskAssignee, setNewTaskAssignee] = React.useState("You");
  const [teamMembers, setTeamMembers] = React.useState<
    Array<{ id?: string; uid?: string; name: string; avatarUrl?: string }>
  >([]);
  const [newTaskDue, setNewTaskDue] = React.useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [newTaskPriority, setNewTaskPriority] = React.useState("medium");
  const [newTaskMilestone, setNewTaskMilestone] = React.useState("");
  const [completedFlash, setCompletedFlash] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    setSavedViews(getSavedViews());
  }, []);

  // Sync state to URL
  const updateUrl = React.useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (
          value === null ||
          value === "" ||
          value === "all" ||
          value === "false"
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const loadProjects = React.useCallback(async () => {
    setLoading(true);
    try {
      const { loadProjects: fetchProjects } = await import("@/lib/data");
      const data = await fetchProjects();
      // FIX: Do not fallback to mock data if array is empty.
      // loadProjects() in lib/data already handles the mock/real switch logic.
      // If it returns [], it means we really have 0 projects (or DB failed),
      // but if we are in "Real" mode, we should show 0 projects.

      const { shouldUseMockData } = await import("@/lib/dataSource");
      const isMock = shouldUseMockData();

      if (Array.isArray(data) && data.length > 0) {
        setProjects(data as Project[]);
      } else if (isMock) {
        // Only if we are EXPLICITLY in mock mode and get empty data, maybe then use internal seed?
        // But lib/data usually returns mock data if in mock mode.
        // If lib/data returned [], it might mean even mock data is empty or filtered?
        // Let's trust lib/data. If it returns [], we show [].
        // However, the original code had a huge hardcoded block here.
        // We will remove it to respect the source of truth.
        setProjects([]);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProjects();
    // Load team members for task assignment
    async function loadTeam() {
      try {
        const { loadUsers } = await import("@/lib/data");
        const users = await loadUsers();
        setTeamMembers(
          Array.isArray(users)
            ? users.map((u) => ({
                id: u.uid,
                uid: u.uid,
                name: u.name,
                avatarUrl: u.avatar_url,
              }))
            : []
        );
      } catch {
        setTeamMembers([]);
      }
    }
    loadTeam();
  }, [loadProjects]);

  // Refresh data when the page becomes visible (commented out to reduce server load in Live Mode)
  /*
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadProjects();
      }
    };

    const handleFocus = () => {
      loadProjects();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [loadProjects]);
  */

  const toggleStar = async (id: string) => {
    // Optimistic Update
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
    );

    try {
      const response = await fetch(`/api/projects/${id}/star`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to star project");
      }
      // Assuming logProjectEvent is defined elsewhere or imported
      // logProjectEvent(id, "star_toggle");
    } catch (error) {
      console.error("Star toggle failed:", error);
      // Revert optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
      );
      showToast("Failed to star project", "error");
    }
  };

  const deleteProject = async (id: string) => {
    const projectName = projects.find((p) => p.id === id)?.name || "Project";
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);

      // Save to appropriate storage
      (async () => {
        try {
          const { saveProjects } = await import("@/lib/data");
          await saveProjects(next);
        } catch (error) {
          console.error("Failed to save projects:", error);
        }
      })();

      return next;
    });
    setDeleteConfirm(null);
    setDeleteInput("");
    showToast(`${projectName} deleted successfully`, "success");
  };

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    saveView({
      name: viewName.trim(),
      query,
      status,
      sortBy,
      starredOnly,
      clientFilter,
    });
    setSavedViews(getSavedViews());
    setViewName("");
    setShowSaveView(false);
  };

  const handleLoadView = (view: SavedView) => {
    setQuery(view.query);
    setStatus(view.status);
    setSortBy(view.sortBy);
    setStarredOnly(view.starredOnly);
    setClientFilter(view.clientFilter || "all");
  };

  const handleDeleteView = (id: string) => {
    deleteSavedView(id);
    setSavedViews(getSavedViews());
  };

  const filtered = React.useMemo(() => {
    const base = projects.filter((p) => {
      const f = query.toLowerCase();
      const matches =
        !f ||
        p.name.toLowerCase().includes(f) ||
        p.owner.toLowerCase().includes(f) ||
        (p.status || "").toLowerCase().includes(f);
      const statusOk =
        status === "all" || (p.status || "").toLowerCase() === status;
      const starOk = !starredOnly || !!p.starred;
      const clientOk =
        clientFilter === "all" ||
        ((p as any).client || "").toLowerCase() === clientFilter.toLowerCase();

      const categoryOk =
        categoryFilter === "all" ||
        (p.category || "") === categoryFilter ||
        (p.categories || []).includes(categoryFilter);
      const tagOk = tagFilter === "all" || (p.tags || []).includes(tagFilter);

      return matches && statusOk && starOk && clientOk && categoryOk && tagOk;
    });
    const sorted = [...base].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "deadline-asc":
          return (a.deadline || "").localeCompare(b.deadline || "");
        case "deadline-desc":
          return (b.deadline || "").localeCompare(a.deadline || "");
        case "starred":
          return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
        default:
          return 0;
      }
    });
    return sorted;
  }, [
    projects,
    query,
    status,
    sortBy,
    starredOnly,
    clientFilter,
    categoryFilter,
    tagFilter,
  ]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProjects = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [query, status, starredOnly, clientFilter, categoryFilter, tagFilter]);

  // Extract all categories and tags for filter dropdowns
  const allCategories = React.useMemo(() => {
    const raw = projects.map((p) => [p.category, ...(p.categories || [])]);
    const flattened = raw.flat().filter(Boolean) as string[];
    return Array.from(new Set(flattened));
  }, [projects]);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [projects]);

  const allStatuses = React.useMemo(() => {
    const statuses = new Set<string>();
    projects.forEach((p) => {
      if (p.status) statuses.add(p.status);
    });
    return Array.from(statuses);
  }, [projects]);

  const allClients = React.useMemo(
    () =>
      Array.from(
        new Set(projects.map((p) => (p as any).client).filter(Boolean))
      ) as string[],
    [projects]
  );
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-14 bg-muted/50 border border-border rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted/50 border border-border rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 border rounded-xl mb-4 bg-card">
        <label htmlFor="search-projects" className="sr-only">
          Search
        </label>
        <input
          id="search-projects"
          name="query"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            updateUrl({ query: e.target.value });
          }}
          placeholder="Search projects..."
          className="w-48 lg:w-64 rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {/* Dynamic Status Filter */}
          <select
            id="filter-status"
            name="status"
            aria-label="Filter by Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              updateUrl({ status: e.target.value });
            }}
            className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="all">Status: All</option>
            {allStatuses.map((s) => (
              <option key={s} value={s.toLowerCase()}>
                {s}
              </option>
            ))}
          </select>

          <select
            id="filter-category"
            name="category"
            aria-label="Filter by Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              updateUrl({ category: e.target.value });
            }}
            className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="all">Category: All</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="filter-client"
            name="client"
            aria-label="Filter by Client"
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              updateUrl({ client: e.target.value });
            }}
            className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="all">Client: All</option>
            {allClients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            id="sort-projects"
            name="sort"
            aria-label="Sort Projects"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              updateUrl({ sort: e.target.value });
            }}
            className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-w-[120px]"
          >
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="deadline-asc">Sort: Deadline (Earliest)</option>
            <option value="deadline-desc">Sort: Deadline (Latest)</option>
            <option value="starred">Sort: Starred</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!selectMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectMode(true);
                setSelectedIds(new Set());
              }}
            >
              Select
            </Button>
          )}
          {selectMode && (
            <>
              <select
                id="bulk-status"
                name="bulkStatus"
                aria-label="Set status for selected projects"
                className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                onChange={(e) => {
                  const val = e.target.value as Project["status"];
                  if (!val) return;
                  setProjects((prev) => {
                    const next = prev.map((p) =>
                      selectedIds.has(p.id) ? { ...p, status: val } : p
                    );
                    try {
                      localStorage.setItem("pv:projects", JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                  e.target.value = "";
                }}
                value=""
                title="Set status for selected"
              >
                <option value="">Set status…</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
                <option value="In Progress">In Progress</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProjects((prev) => {
                    const next = prev.map((p) =>
                      selectedIds.has(p.id) ? { ...p, archived: true } : p
                    );
                    try {
                      localStorage.setItem("pv:projects", JSON.stringify(next));
                    } catch {}
                    return next;
                  });
                  setSelectedIds(new Set());
                }}
              >
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }}
              >
                Done
              </Button>
            </>
          )}
          {savedViews.length > 0 && (
            <div className="relative">
              <select
                id="load-view"
                name="loadView"
                aria-label="Load Saved View"
                className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm pr-8"
                onChange={(e) => {
                  const v = savedViews.find(
                    (view) => view.id === e.target.value
                  );
                  if (v) handleLoadView(v);
                  e.target.value = "";
                }}
                value=""
              >
                <option value="">Load Saved View</option>
                {savedViews.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!showSaveView ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveView(true)}
            >
              Save View
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <label htmlFor="view-name" className="sr-only">
                View Name
              </label>
              <input
                id="view-name"
                name="viewName"
                className="w-32 rounded-md border border-border bg-card text-foreground px-2 py-1 text-sm"
                placeholder="View name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveView();
                }}
              />
              <Button variant="primary" size="sm" onClick={handleSaveView}>
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSaveView(false);
                  setViewName("");
                }}
              >
                ×
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setStatus("all");
              updateUrl({
                query: "",
                status: null,
                category: null,
                tag: null,
                client: null,
                starred: null,
              });
              setSortBy("name-asc");
              setStarredOnly(false);
              setClientFilter("all");
              setCategoryFilter("all");
              setTagFilter("all");
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Saved Views Manager */}
      {savedViews.length > 0 && (
        <div className="mb-4 p-3 border rounded-xl bg-card">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Saved Views
          </p>
          <div className="flex flex-wrap gap-2">
            {savedViews.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 bg-accent px-3 py-1 rounded-md text-sm"
              >
                <button
                  onClick={() => handleLoadView(v)}
                  className="hover:underline cursor-pointer"
                >
                  {v.name}
                </button>
                <button
                  onClick={() => handleDeleteView(v.id)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Delete view"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground text-lg">
            No projects found matching your filters.
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((p) => {
              const totalMembers = (p.members || []).length;
              const fallbackProgress =
                p.status === "Completed"
                  ? 100
                  : p.status === "Active"
                    ? 65
                    : p.status === "In Progress"
                      ? 40
                      : 20;
              const daysLeft = p.deadline
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(p.deadline).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                : null;
              const health = calculateProjectHealth({
                id: p.id,
                deadline: p.deadline,
                status: p.status,
              });
              // Snapshot health (once per day per project)
              try {
                snapshotHealth(p.id, health.score);
              } catch {}
              const filesCount = getProjectFiles(p.id).length;
              const taskStats = getTaskCompletionForProject(p.id);
              const hasTasks = taskStats.total > 0;
              const progress = hasTasks ? taskStats.percent : fallbackProgress;

              return (
                <Card
                  key={p.id}
                  className="group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-primary/20"
                  onClick={() =>
                    router.push(`/projects/${p.slug || p.uid || p.id}`)
                  }
                >
                  {selectMode && (
                    <div className="absolute top-2 left-2 z-20">
                      <input
                        id={`select-${p.id}`}
                        name={`select_${p.id}`}
                        aria-label={`Select ${p.name}`}
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(p.id);
                            else next.delete(p.id);
                            return next;
                          });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  {/* Gradient overlay (visual only, ignore pointer events) */}
                  <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Cover with overlay gradient */}
                  <div className="relative h-36 bg-linear-to-br from-primary/20 to-accent/30 overflow-hidden">
                    {p.cover ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.cover}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-6xl font-bold text-primary/10">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* Floating action buttons */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        className={`p-2 rounded-lg cursor-pointer backdrop-blur-sm bg-white/90 shadow-md transition-all hover:scale-110 ${p.starred ? "text-amber-500" : "text-muted-foreground"}`}
                        title={p.starred ? "Unstar" : "Star"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(p.id);
                        }}
                      >
                        <Star
                          className="w-4 h-4"
                          fill={p.starred ? "currentColor" : "none"}
                        />
                      </button>
                      <div className="relative">
                        <button
                          className="p-2 rounded-lg cursor-pointer backdrop-blur-sm bg-white/90 shadow-md transition-all hover:scale-110 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(menuOpen === p.id ? null : p.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === p.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(null);
                              }}
                            />
                            <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px]">
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpen(null);
                                  router.push(
                                    `/projects/${p.slug || p.uid || p.id}`
                                  );
                                }}
                              >
                                Open
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpen(null);
                                  setDeleteConfirm({ id: p.id, name: p.name });
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge overlay */}
                    <div className="absolute bottom-2 left-2">
                      <Badge
                        variant={
                          p.status === "Active"
                            ? "info"
                            : p.status === "Completed"
                              ? "success"
                              : "warning"
                        }
                        pill
                        className="backdrop-blur-sm bg-white/90 shadow-md"
                      >
                        {p.status}
                      </Badge>
                    </div>

                    {/* Health score badge with hover breakdown + sparkline */}
                    <div className="absolute bottom-2 right-2">
                      <div
                        className={`group relative backdrop-blur-sm bg-white/90 shadow-md px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          health.status === "excellent"
                            ? "text-green-600"
                            : health.status === "good"
                              ? "text-blue-600"
                              : health.status === "warning"
                                ? "text-amber-600"
                                : "text-red-600"
                        }`}
                        title={`Health Score: ${health.score}/100`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            health.status === "excellent"
                              ? "bg-green-600"
                              : health.status === "good"
                                ? "bg-blue-600"
                                : health.status === "warning"
                                  ? "bg-amber-600"
                                  : "bg-red-600"
                          }`}
                        />
                        {health.score}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {p.client ? `Client: ${p.client}` : "Internal Project"}
                      </p>
                    </div>
                    {/* Categories and Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {/* Show all categories, preferring the array but falling back to legacy single string */}
                      {(p.categories && p.categories.length > 0
                        ? p.categories
                        : p.category
                          ? [p.category]
                          : []
                      ).map((cat) => (
                        <button
                          key={cat}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCategoryFilter(cat);
                            updateUrl({ category: cat });
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                      {p.tags?.slice(0, 3).map((tag) => (
                        <button
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTagFilter(tag);
                            updateUrl({ tag });
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground hover:bg-accent/80 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                      {(p.tags?.length || 0) > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                          +{(p.tags?.length || 0) - 3}
                        </span>
                      )}
                    </div>

                    {/* Progress bar with percentage (uses tasks when available) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">
                          Progress
                          {hasTasks
                            ? ` • ${taskStats.done}/${taskStats.total}`
                            : ""}
                        </span>
                        <span className="font-bold text-primary">
                          {progress}%
                        </span>
                      </div>
                      <div className="h-2 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary to-primary/60 transition-all duration-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3 py-3 border-t border-b border-border">
                      <div className="text-center">
                        <div className="text-lg font-bold text-primary">
                          {totalMembers}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Members
                        </div>
                      </div>
                      <div className="text-center border-l border-r border-border">
                        <div className="text-lg font-bold text-primary">
                          {filesCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Files
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-lg font-bold ${daysLeft !== null && daysLeft < 7 ? "text-destructive" : "text-primary"}`}
                        >
                          {daysLeft !== null ? daysLeft : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Days left
                        </div>
                      </div>
                    </div>

                    {/* Members avatars */}
                    {totalMembers > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {(p.members || []).slice(0, 4).map((m: any, idx) => {
                            const name = m.user?.name || m.name || "Member";
                            const avatar = m.user?.avatarUrl || m.avatarUrl;
                            const uid = m.user?.uid || m.uid || m.id;

                            return (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={idx}
                                src={
                                  avatar ||
                                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                                    name
                                  )}`
                                }
                                alt={name}
                                className="w-8 h-8 rounded-full border-2 border-card bg-white ring-1 ring-border cursor-pointer hover:scale-110 transition-transform"
                                title={name}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (uid) router.push(`/team/${uid}`);
                                }}
                              />
                            );
                          })}
                          {totalMembers > 4 && (
                            <div className="w-8 h-8 rounded-full border-2 border-card bg-accent text-foreground text-xs flex items-center justify-center font-medium ring-1 ring-border">
                              +{totalMembers - 4}
                            </div>
                          )}
                        </div>
                        {p.priority && (
                          <Badge
                            variant={
                              p.priority === "high"
                                ? "warning"
                                : p.priority === "medium"
                                  ? "info"
                                  : "secondary"
                            }
                            pill
                            className="ml-auto"
                          >
                            {p.priority}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Custom Fields Chips */}
                    {((p as any).client ||
                      (p as any).budget ||
                      (p as any).sla) && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                        {(p as any).client && (
                          <Badge variant="secondary" pill>
                            Client: {(p as any).client}
                          </Badge>
                        )}
                        {(p as any).budget && (
                          <Badge variant="info" pill>
                            Budget: ${(p as any).budget}
                          </Badge>
                        )}
                        {(p as any).sla && (
                          <Badge variant="info" pill>
                            <abbr
                              className="border-b border-dashed border-current no-underline cursor-help"
                              title="Service Level Agreement"
                            >
                              SLA
                            </abbr>
                            : {(p as any).sla}d
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddForProject(p.id);
                          setNewTaskTitle("");
                          setNewTaskAssignee("You");
                          setNewTaskDue(
                            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                              .toISOString()
                              .slice(0, 10)
                          );
                          setNewTaskPriority("medium");
                          setNewTaskMilestone("");
                          setAddOpen(true);
                        }}
                      >
                        + Task
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle Complete/Undo
                          setProjects((prev) => {
                            const next = prev.map((pr) =>
                              pr.id === p.id
                                ? {
                                    ...pr,
                                    status:
                                      pr.status === "Completed"
                                        ? ("Active" as const)
                                        : ("Completed" as const),
                                  }
                                : pr
                            );
                            try {
                              localStorage.setItem(
                                "pv:projects",
                                JSON.stringify(next)
                              );
                              logProjectEvent(p.id, "edit", {
                                status:
                                  p.status === "Completed"
                                    ? "Active"
                                    : "Completed",
                              });
                            } catch {}
                            return next;
                          });
                          if (p.status !== "Completed") {
                            setCompletedFlash(p.id);
                            setTimeout(() => setCompletedFlash(null), 1200);
                          }
                        }}
                      >
                        {p.status === "Completed" ? "Undo" : "Mark Complete"}
                      </Button>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center gap-1 text-xs pt-2">
                      <span className="text-muted-foreground">Due:</span>
                      <span
                        className={`font-medium ${daysLeft !== null && daysLeft < 7 ? "text-destructive" : "text-foreground"}`}
                      >
                        {p.deadline
                          ? new Date(p.deadline).toLocaleDateString("en-US", {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            })
                          : "No deadline"}
                      </span>
                    </div>
                    {/* Completed flash overlay */}
                    {completedFlash === p.id && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-600/10">
                        <div className="text-green-600 text-4xl font-black">
                          ✓
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  const p = Math.max(1, currentPage - 1);
                  setCurrentPage(p);
                  updateUrl({ page: p.toString() });
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => {
                  const p = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(p);
                  updateUrl({ page: p.toString() });
                }}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {deleteConfirm.name}
              </span>
              ? This action cannot be undone.
            </p>
            <label
              htmlFor="confirm-delete-input"
              className="text-sm text-muted-foreground mb-2 block"
            >
              Type the project name to confirm:
            </label>
            <input
              id="confirm-delete-input"
              name="confirmProjectName"
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={deleteConfirm.name}
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirm(null);
                  setDeleteInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteProject(deleteConfirm.id)}
                disabled={deleteInput !== deleteConfirm.name}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal open={addOpen} onOpenChange={setAddOpen} size="lg">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Create Task</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="task-title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="task-title"
                name="taskTitle"
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g., Draft project plan"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-assignee" className="text-sm font-medium">
                Assignee
              </label>
              <select
                id="task-assignee"
                name="taskAssignee"
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
              >
                <option value="You">You</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="task-due" className="text-sm font-medium">
                Due Date
              </label>
              <input
                id="task-due"
                name="taskDue"
                type="date"
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="task-priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="task-priority"
                name="taskPriority"
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            {addForProject && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Milestone</label>
                <select
                  className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                  value={newTaskMilestone}
                  onChange={(e) => setNewTaskMilestone(e.target.value)}
                >
                  <option value="">None</option>
                  {getMilestonesByProject(addForProject).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!addForProject || !newTaskTitle.trim()) return;
                try {
                  const id = `task-${Date.now()}`;
                  upsertTask({
                    id,
                    projectId: addForProject,
                    title: newTaskTitle.trim(),
                    status: "todo",
                    assignee: newTaskAssignee || "You",
                    due: newTaskDue,
                    priority: newTaskPriority as any,
                    milestoneId: newTaskMilestone || undefined,
                  });
                  showToast("Task created", "success");
                  setAddOpen(false);
                } catch {
                  showToast("Failed to create task", "error");
                }
              }}
              disabled={!newTaskTitle.trim()}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
