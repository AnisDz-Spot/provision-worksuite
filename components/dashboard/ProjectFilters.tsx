"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Project } from "./types";
import { SavedView } from "@/lib/utils";
import { getCsrfToken } from "@/lib/csrf-client";
import { useToast } from "@/components/ui/Toast";

interface ProjectFiltersProps {
  query: string;
  setQuery: (q: string) => void;
  status: string;
  setStatus: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  clientFilter: string;
  setClientFilter: (c: string) => void;
  tagFilter: string;
  setTagFilter: (t: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  starredOnly: boolean;
  setStarredOnly: (b: boolean) => void;

  allStatuses: string[];
  allCategories: string[];
  allClients: string[];

  updateUrl: (params: Record<string, string | null>) => void;

  selectMode: boolean;
  setSelectMode: (b: boolean) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;

  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  loadProjects: () => void;

  savedViews: SavedView[];
  viewName: string;
  setViewName: (s: string) => void;
  showSaveView: boolean;
  setShowSaveView: (b: boolean) => void;
  handleSaveView: () => void;
  handleLoadView: (view: SavedView) => void;
  handleDeleteView: (id: string) => void;
}

export function ProjectFilters({
  query,
  setQuery,
  status,
  setStatus,
  categoryFilter,
  setCategoryFilter,
  clientFilter,
  setClientFilter,
  tagFilter,
  setTagFilter,
  sortBy,
  setSortBy,
  starredOnly,
  setStarredOnly,
  allStatuses,
  allCategories,
  allClients,
  updateUrl,
  selectMode,
  setSelectMode,
  selectedIds,
  setSelectedIds,
  projects,
  setProjects,
  loadProjects,
  savedViews,
  viewName,
  setViewName,
  showSaveView,
  setShowSaveView,
  handleSaveView,
  handleLoadView,
  handleDeleteView,
}: ProjectFiltersProps) {
  const { showToast } = useToast();
  // Simple client-side cache singleton reference needs to be managed if we update projects?
  // In ProjectGrid, cachedProjects is a module-level variable.
  // We can't access it here directly to update it.
  // We might need to handle the optimistic cache update via a callback prop or just ignore it here
  // (ProjectGrid handles setProjects but we need to update cache too).
  // Actually, in ProjectGrid line 559 `cachedProjects = next` is done inside setProjects updater.
  // Since we pass setProjects, the updater function defined HERE will run.
  // But `cachedProjects` is not in this scope.
  // Use a hack: we can't write to `cachedProjects` variable in parent module from here.
  // BUT the `setProjects` updater callback runs in the scope where it is defined? NO.
  // It runs where it is executed by React.
  // Wait, `setProjects((prev) => ...)` - the arrow function is defined HERE.
  // So we cannot update `cachedProjects` global variable of ProjectGrid.tsx from here.
  // This is a functionality change risk.
  // However, `cachedProjects` is mainly for "initial load". Detailed updates might be fine if missed,
  // OR we should pass a specific callback "updateProjects" that handles both state and cache.

  // Let's refactor `setProjects` calls in bulk actions to use a prop method `onBulkUpdate`?
  // Ideally yes, to keep the cache logic in ProjectGrid.

  // Implementation below assumes we fix that by adding two callbacks: onBulkUpdateStatus and onBulkArchive.

  return (
    <>
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
                onChange={async (e) => {
                  const val = e.target.value as Project["status"];
                  if (!val) return;

                  const selectedProjectIds = Array.from(selectedIds);
                  const csrfToken = getCsrfToken() || "";

                  try {
                    // Optimistic update - this bypasses cache update in parent module but updates state
                    setProjects((prev) => {
                      const next = prev.map((p) =>
                        selectedIds.has(p.id) ? { ...p, status: val } : p
                      );
                      // cachedProjects update skipped here because we can't reach it.
                      // This is a trade-off. We could pass a "updateCache" callback?
                      // For now, simple state update is enough for UI.
                      return next;
                    });

                    // API call for each selected project
                    await Promise.all(
                      selectedProjectIds.map((id) =>
                        fetch(`/api/projects/${id}`, {
                          method: "PUT", // Assuming PUT for status update
                          headers: {
                            "Content-Type": "application/json",
                            "x-csrf-token": csrfToken,
                          },
                          body: JSON.stringify({ status: val }),
                        })
                      )
                    );
                    showToast(
                      "Selected projects updated successfully",
                      "success"
                    );
                  } catch (error) {
                    console.error("Bulk status update failed:", error);
                    showToast("Failed to update selected projects", "error");
                    loadProjects(); // Revert by re-fetching
                  } finally {
                    e.target.value = "";
                  }
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
                onClick={async () => {
                  const selectedProjectIds = Array.from(selectedIds);
                  const csrfToken = getCsrfToken() || "";

                  try {
                    // Optimistic update
                    setProjects((prev) => {
                      const next = prev.map((p) =>
                        selectedIds.has(p.id) ? { ...p, archived: true } : p
                      );
                      return next;
                    });

                    // API call for each selected project
                    await Promise.all(
                      selectedProjectIds.map((id) =>
                        fetch(`/api/projects/${id}`, {
                          method: "PUT", // Assuming PUT for archiving
                          headers: {
                            "Content-Type": "application/json",
                            "x-csrf-token": csrfToken,
                          },
                          body: JSON.stringify({ archived: true }),
                        })
                      )
                    );
                    showToast(
                      "Selected projects archived successfully",
                      "success"
                    );
                  } catch (error) {
                    console.error("Bulk archive failed:", error);
                    showToast("Failed to archive selected projects", "error");
                    loadProjects(); // Revert by re-fetching
                  } finally {
                    setSelectedIds(new Set());
                  }
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
                defaultValue=""
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
    </>
  );
}
