"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Project } from "./types";
import { SavedView } from "@/lib/utils";
import { fetchWithCsrf } from "@/lib/csrf-client";
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
  healthFilter: string;
  setHealthFilter: (h: string) => void;

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
  healthFilter,
  setHealthFilter,
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
  return (
    <>
      <div className="p-3 border rounded-xl mb-4 bg-card flex flex-col xl:flex-row gap-4">
        {/* Filter Fields Group */}
        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-w-0">
          <div className="w-full lg:w-64 shrink-0">
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
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-row flex-wrap lg:flex-nowrap items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            <select
              id="filter-health"
              name="health"
              aria-label="Filter by Health"
              value={healthFilter}
              onChange={(e) => {
                setHealthFilter(e.target.value);
                updateUrl({ health: e.target.value });
              }}
              className="rounded-md border border-border bg-card text-foreground px-2 py-2 text-xs w-auto min-w-[100px] shrink-0"
            >
              <option value="all">Health: All</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="at-risk">At Risk</option>
              <option value="critical">Critical</option>
            </select>

            <select
              id="filter-status"
              name="status"
              aria-label="Filter by Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                updateUrl({ status: e.target.value });
              }}
              className="rounded-md border border-border bg-card text-foreground px-2 py-2 text-xs w-auto min-w-[100px] shrink-0"
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
              className="rounded-md border border-border bg-card text-foreground px-2 py-2 text-xs w-auto min-w-[100px] shrink-0"
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
              className="rounded-md border border-border bg-card text-foreground px-2 py-2 text-xs w-auto min-w-[100px] shrink-0"
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
              className="rounded-md border border-border bg-card text-foreground px-2 py-2 text-xs w-auto min-w-[100px] shrink-0"
            >
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="deadline-asc">Sort: Deadline (Earliest)</option>
              <option value="deadline-desc">Sort: Deadline (Latest)</option>
              <option value="starred">Sort: Starred</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 xl:border-l xl:pl-4 shrink-0">
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
                  try {
                    // Optimistic update
                    setProjects((prev) => {
                      const next = prev.map((p) =>
                        selectedIds.has(p.id) ? { ...p, status: val } : p
                      );
                      return next;
                    });

                    // API call for each selected project
                    await Promise.all(
                      selectedProjectIds.map((id) =>
                        fetchWithCsrf(`/api/projects/${id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
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
                        fetchWithCsrf(`/api/projects/${id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
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
              setHealthFilter("all");
              updateUrl({
                query: "",
                status: null,
                category: null,
                tag: null,
                client: null,
                starred: null,
                health: null,
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

      {/* Quick Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
        <Button
          variant={healthFilter === "at-risk" ? "primary" : "outline"}
          size="sm"
          className="rounded-full text-xs whitespace-nowrap"
          onClick={() => {
            const next = healthFilter === "at-risk" ? "all" : "at-risk";
            setHealthFilter(next);
            updateUrl({ health: next });
          }}
        >
          ⚠️ At Risk
        </Button>
        <Button
          variant={healthFilter === "critical" ? "primary" : "outline"}
          size="sm"
          className="rounded-full text-xs whitespace-nowrap"
          onClick={() => {
            const next = healthFilter === "critical" ? "all" : "critical";
            setHealthFilter(next);
            updateUrl({ health: next });
          }}
        >
          🚨 Critical
        </Button>
        <Button
          variant={starredOnly ? "primary" : "outline"}
          size="sm"
          className="rounded-full text-xs whitespace-nowrap"
          onClick={() => {
            setStarredOnly(!starredOnly);
            updateUrl({ starred: (!starredOnly).toString() });
          }}
        >
          ⭐ Starred
        </Button>
      </div>
    </>
  );
}
