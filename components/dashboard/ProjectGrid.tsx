"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import {
  getSavedViews,
  saveView,
  deleteSavedView,
  SavedView,
  getProjectFiles,
} from "@/lib/utils";
import { getCsrfToken } from "@/lib/csrf-client";

import { ProjectCard } from "./ProjectCard";
import { ProjectFilters } from "./ProjectFilters";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { QuickTaskModal } from "./QuickTaskModal";
import { Project } from "./types";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Simple client-side cache singleton
let cachedProjects: any[] | null = null;

/* Project type moved to ./types.ts */

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

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [savedViews, setSavedViews] = React.useState<SavedView[]>([]);
  const [viewName, setViewName] = React.useState("");
  const [showSaveView, setShowSaveView] = React.useState(false);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = React.useState(false);
  const [addForProject, setAddForProject] = React.useState<string | null>(null);
  const [teamMembers, setTeamMembers] = React.useState<
    Array<{ id?: string; uid?: string; name: string; avatarUrl?: string }>
  >([]);
  /* New task state moved to QuickTaskModal */
  /* Completed flash state moved to ProjectCard */

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
        cachedProjects = data; // Update cache
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
    if (cachedProjects) {
      setProjects(cachedProjects as Project[]);
      setLoading(false);
    } else {
      loadProjects();
    }

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

  // Auto-refresh disabled to prevent excessive API calls
  // Projects will refresh on initial load and manual navigation
  /*
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Clear cache and reload to get fresh data
        cachedProjects = null;
        loadProjects();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadProjects]);
  */

  const toggleStar = async (id: string) => {
    let updatedProject: Project | undefined;
    setProjects((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedProject = { ...p, starred: !p.starred };
          return updatedProject;
        }
        return p;
      });
      cachedProjects = next; // Update cache with optimistic state
      return next;
    });

    try {
      const response = await fetch(`/api/projects/${id}/star`, {
        method: "POST",
        headers: {
          "x-csrf-token": getCsrfToken() || "",
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to star project");
      }
      // If successful, cache is already updated by optimistic update
    } catch (error: any) {
      console.error("Star toggle failed:", error);
      // Revert optimistic update and cache
      setProjects((prev) => {
        const reverted = prev.map((p) =>
          p.id === id ? { ...p, starred: !p.starred } : p
        );
        cachedProjects = reverted;
        return reverted;
      });
      showToast(error.message || "Failed to star project", "error");
    }
  };

  const deleteProject = async (id: string) => {
    const projectName = projects.find((p) => p.id === id)?.name || "Project";
    const nextProjects = projects.filter((p) => p.id !== id);

    setProjects(nextProjects);
    cachedProjects = nextProjects; // Update cache immediately

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": getCsrfToken() || "",
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to delete project");
      }
      // If API call is successful, cache and state are already updated
      showToast(`${projectName} deleted successfully`, "success");
    } catch (error: any) {
      console.error("Delete project failed:", error);
      // Revert state and cache if API call fails
      loadProjects(); // Re-fetch all projects to restore state
      showToast(error.message || "Failed to delete project", "error");
    } finally {
      setDeleteConfirm(null);
    }
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
        (p.name || "").toLowerCase().includes(f) ||
        (p.owner || "").toLowerCase().includes(f) ||
        (p.status || "").toLowerCase().includes(f);
      const statusOk =
        status === "all" || (p.status || "").toLowerCase() === status;
      const starOk = !starredOnly || !!p.starred;
      const clientOk =
        clientFilter === "all" ||
        ((p as any).client || (p as any).clientName || "").toLowerCase() ===
          clientFilter.toLowerCase();

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

  const handleStatusUpdate = async (
    project: Project,
    newStatus: Project["status"]
  ) => {
    const csrfToken = getCsrfToken() || "";
    try {
      // Optimistic update
      setProjects((prev) => {
        const next = prev.map((pr) =>
          pr.id === project.id ? { ...pr, status: newStatus } : pr
        );
        cachedProjects = next;
        return next;
      });

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      console.error("Status update failed:", error);
      showToast("Failed to update project status", "error");
      loadProjects(); // Revert
    }
  };

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
        new Set(
          projects
            .map((p) => (p as any).client || (p as any).clientName)
            .filter(Boolean)
        )
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
      <ProjectFilters
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        starredOnly={starredOnly}
        setStarredOnly={setStarredOnly}
        allStatuses={allStatuses}
        allCategories={allCategories}
        allClients={allClients}
        updateUrl={updateUrl}
        selectMode={selectMode}
        setSelectMode={setSelectMode}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        projects={projects}
        setProjects={setProjects}
        loadProjects={loadProjects}
        savedViews={savedViews}
        viewName={viewName}
        setViewName={setViewName}
        showSaveView={showSaveView}
        setShowSaveView={setShowSaveView}
        handleSaveView={handleSaveView}
        handleLoadView={handleLoadView}
        handleDeleteView={handleDeleteView}
      />

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
              const filesCount = p.filesCount || 0;
              return (
                <ProjectCard
                  key={p.id}
                  project={p}
                  toggleStar={toggleStar}
                  onDelete={(project) =>
                    setDeleteConfirm({ id: project.id, name: project.name })
                  }
                  onStatusUpdate={handleStatusUpdate}
                  onQuickTask={(projectId) => {
                    setAddForProject(projectId);
                    setAddOpen(true);
                  }}
                  isDeleting={false}
                  filesCount={filesCount}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onSelect={(id, selected) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (selected) next.add(id);
                      else next.delete(id);
                      return next;
                    });
                  }}
                  setDeleteConfirm={setDeleteConfirm}
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                className="px-3 py-1 rounded-md border border-border hover:bg-accent disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => {
                  const p = Math.max(1, currentPage - 1);
                  setCurrentPage(p);
                  updateUrl({ page: p.toString() });
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-1 inline" /> Prev
              </button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              <button
                className="px-3 py-1 rounded-md border border-border hover:bg-accent disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => {
                  const p = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(p);
                  updateUrl({ page: p.toString() });
                }}
              >
                Next <ChevronRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          )}
        </>
      )}

      <DeleteConfirmModal
        project={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={(id) => {
          deleteProject(id);
          setDeleteConfirm(null);
        }}
      />

      <QuickTaskModal
        open={addOpen}
        setOpen={setAddOpen}
        projectId={addForProject}
        teamMembers={teamMembers}
      />
    </>
  );
}
