"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  TableMeta,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Star, Users } from "lucide-react";
import {
  logProjectEvent,
  getTaskCompletionForProject,
  getProjectTimeRollup,
} from "@/lib/utils";
import { shouldUseDatabaseData } from "@/lib/dataSource";

// Extend TableMeta to include custom methods
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    toggleStar?: (id: string) => void;
  }
}

type Project = {
  id: string;
  uid?: string; // Database UID
  slug?: string; // Human-readable slug
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string; // ISO date
  priority?: "low" | "medium" | "high";
  starred?: boolean;
  members?: { name: string; avatarUrl?: string; user?: any }[];
  isTemplate?: boolean;
  archived?: boolean;
  // Database fields
  _count?: { tasks: number; milestones: number };
  tasks?: {
    status: string;
    estimateHours: number | null;
    loggedHours: number | null;
  }[];
};

const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Project Alpha",
    owner: "Alice",
    status: "Active",
    deadline: "2025-12-11",
    priority: "high",
    starred: true,
    members: [
      { name: "Alice" },
      { name: "Bob" },
      { name: "Carol" },
      { name: "David" },
      { name: "Eve" },
      { name: "Frank" },
    ],
  },
  {
    id: "p2",
    name: "Project Beta",
    owner: "Bob",
    status: "Completed",
    deadline: "2025-10-22",
    priority: "medium",
    members: [{ name: "Bob" }, { name: "Alice" }],
  },
  {
    id: "p3",
    name: "Project Gamma",
    owner: "Carol",
    status: "Paused",
    deadline: "2026-01-19",
    priority: "low",
    starred: false,
    members: [{ name: "Carol" }],
  },
  {
    id: "p4",
    name: "Project Delta",
    owner: "David",
    status: "Active",
    deadline: "2026-04-03",
    priority: "medium",
    members: [{ name: "David" }, { name: "Eve" }],
  },
];

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: () => "Project",
    cell: ({ row, table }) => {
      const p = row.original;
      return (
        <div className="flex items-center gap-2">
          <button
            className={`p-1 rounded hover:bg-accent/20 ${p.starred ? "text-amber-500" : "text-muted-foreground"}`}
            title={p.starred ? "Unstar" : "Star"}
            onClick={(e) => {
              e.stopPropagation();
              table.options.meta?.toggleStar?.(p.id);
            }}
          >
            <Star
              className="w-4 h-4"
              fill={p.starred ? "currentColor" : "none"}
            />
          </button>
          <span>{p.name}</span>
        </div>
      );
    },
  },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={
            status === "Active"
              ? "info"
              : status === "Completed"
                ? "success"
                : "warning"
          }
          pill
        >
          {status}
        </Badge>
      );
    },
  },
  { accessorKey: "deadline", header: "Deadline" },
  {
    id: "time",
    header: () => "Time",
    cell: ({ row }) => {
      const p = row.original;

      // Calculate from API tasks if available, else fallback
      let estimate = 0,
        logged = 0;
      if (p.tasks && p.tasks.length > 0) {
        p.tasks.forEach((t) => {
          estimate += t.estimateHours || 0;
          logged += t.loggedHours || 0;
        });
      } else if (!shouldUseDatabaseData()) {
        const r = getProjectTimeRollup(p.id);
        estimate = r.estimate;
        logged = r.logged;
      }

      const remaining = Math.max(0, parseFloat((estimate - logged).toFixed(2)));

      return (
        <div className="flex items-center gap-2 text-[10px]">
          <Badge variant="secondary" pill>
            Est {parseFloat(estimate.toFixed(2))}h
          </Badge>
          <Badge variant="info" pill>
            Log {parseFloat(logged.toFixed(2))}h
          </Badge>
          <Badge variant="warning" pill>
            Rem {remaining}h
          </Badge>
        </div>
      );
    },
  },
  {
    id: "progress",
    header: () => "Progress",
    cell: ({ row }) => {
      const p = row.original;

      let total = 0,
        done = 0,
        percent = 0;

      if (p.tasks && p.tasks.length > 0) {
        total = p.tasks.length;
        done = p.tasks.filter(
          (t) => t.status === "done" || t.status === "completed"
        ).length;
        percent = total > 0 ? Math.round((done / total) * 100) : 0;
      } else if (!shouldUseDatabaseData()) {
        const t = getTaskCompletionForProject(p.id);
        total = t.total;
        done = t.done;
        percent = t.percent;
      }

      const fallback =
        p.status === "Completed"
          ? 100
          : p.status === "Active"
            ? 65
            : p.status === "In Progress"
              ? 40
              : 20;

      const displayPercent =
        total > 0
          ? percent
          : shouldUseDatabaseData()
            ? p.status === "Completed"
              ? 100
              : 0
            : fallback;

      return (
        <div className="min-w-40">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{total > 0 ? `${done}/${total}` : "—"}</span>
            <span className="font-medium text-foreground">
              {displayPercent}%
            </span>
          </div>
          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-primary/60"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "members",
    header: () => "Members",
    cell: ({ row }) => {
      const members = row.original.members || [];
      const shown = members.slice(0, 5);
      const extra = members.length - shown.length;
      return (
        <div className="flex items-center">
          {shown.map((m, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={
                m.avatarUrl ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
              }
              alt={m.name}
              className="w-6 h-6 rounded-full border -ml-2 first:ml-0 bg-white"
            />
          ))}
          {extra > 0 && (
            <div className="w-6 h-6 rounded-full border -ml-2 first:ml-0 bg-muted text-foreground text-[10px] flex items-center justify-center">
              +{extra}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => "Actions",
    cell: () => null,
  },
];

export function ProjectTable() {
  const router = useRouter();
  const [data, setData] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const { loadProjects } = await import("@/lib/data");
        const projects = await loadProjects();
        setData(projects);
      } catch (error) {
        console.error("Failed to load projects:", error);
        setData(PROJECTS); // Fallback to mock data
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("name-asc");
  const [starredOnly, setStarredOnly] = React.useState(false);
  const [timeFilter, setTimeFilter] = React.useState<string>("all");
  const [pageIndex, setPageIndex] = React.useState(0);
  const pageSize = 5;
  const [menuOpen, setMenuOpen] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteInput, setDeleteInput] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _colId, filter) => {
      const p = row.original as Project;
      const f = String(filter).toLowerCase();
      return (
        p.name.toLowerCase().includes(f) ||
        p.owner.toLowerCase().includes(f) ||
        (p.status || "").toLowerCase().includes(f)
      );
    },
    meta: {
      toggleStar: async (id: string) => {
        setData((prev) => {
          const next = prev.map((p) => {
            if (p.id === id) {
              const newStar = !p.starred;
              try {
                logProjectEvent(p.id, newStar ? "star" : "unstar");
              } catch {}
              return { ...p, starred: newStar };
            }
            return p;
          });

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
      },
    },
  });

  const deleteProject = async (id: string) => {
    setData((prev) => {
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
  };

  // Apply status filter and manual sort + pagination
  const filtered = React.useMemo(() => {
    const base = table.getRowModel().rows.map((r) => r.original as Project);
    const byStatus =
      statusFilter === "all"
        ? base
        : base.filter((p) => p.status.toLowerCase() === statusFilter);
    const byStar = starredOnly ? byStatus.filter((p) => !!p.starred) : byStatus;
    const byTime =
      timeFilter === "all"
        ? byStar
        : byStar.filter((p) => {
            const t = getProjectTimeRollup(p.id);
            if (timeFilter === "remaining") return t.remaining > 0.001;
            if (timeFilter === "over") return t.logged > t.estimate + 0.001;
            return true;
          });
    const sorted = [...byTime].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "deadline-asc":
          return a.deadline.localeCompare(b.deadline);
        case "deadline-desc":
          return b.deadline.localeCompare(a.deadline);
        case "time-remaining-desc": {
          const ra = getProjectTimeRollup(a.id).remaining;
          const rb = getProjectTimeRollup(b.id).remaining;
          return rb - ra;
        }
        case "time-over-desc": {
          const oa = getProjectTimeRollup(a.id);
          const ob = getProjectTimeRollup(b.id);
          const da = oa.logged - oa.estimate;
          const db = ob.logged - ob.estimate;
          return db - da;
        }
        case "starred":
          return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
        default:
          return 0;
      }
    });
    return sorted;
  }, [table.getRowModel().rows, statusFilter, sortBy, starredOnly, timeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  React.useEffect(() => {
    if (pageIndex >= totalPages) setPageIndex(Math.max(0, totalPages - 1));
  }, [totalPages, pageIndex]);

  const openProject = (projectId: string) =>
    router.push(`/projects/${projectId}`);

  return (
    <div className="rounded-xl border shadow-md bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b">
        <Input
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPageIndex(0);
          }}
          placeholder="Search projects..."
          className="w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPageIndex(0);
          }}
          className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          title="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="in progress">In Progress</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          title="Sort by"
        >
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
          <option value="deadline-asc">Deadline ↑</option>
          <option value="deadline-desc">Deadline ↓</option>
          <option value="time-remaining-desc">Remaining hours ↓</option>
          <option value="time-over-desc">Over hours ↓</option>
          <option value="starred">Starred first</option>
        </select>
        <select
          value={timeFilter}
          onChange={(e) => {
            setTimeFilter(e.target.value);
            setPageIndex(0);
          }}
          className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          title="Filter by time"
        >
          <option value="all">All time states</option>
          <option value="remaining">Remaining {">"} 0</option>
          <option value="over">Logged {">"} Estimate</option>
        </select>
        <label className="flex items-center gap-2 ml-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={starredOnly}
            onChange={(e) => {
              setStarredOnly(e.target.checked);
              setPageIndex(0);
            }}
            className="cursor-pointer"
          />
          Starred only
        </label>
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
                className="rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                onChange={(e) => {
                  const val = e.target.value as Project["status"];
                  if (!val) return;
                  setData((prev) => {
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
                  setData((prev) => {
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setGlobalFilter("");
              setSortBy("name-asc");
              setStarredOnly(false);
              setTimeFilter("all");
              setPageIndex(0);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mr-3"></div>
          Loading projects...
        </div>
      ) : pageRows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No projects found</p>
          <p className="text-sm">Start by creating your first project</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-accent/20">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {selectMode && <th className="p-4"></th>}
                    {hg.headers.map((h) => (
                      <th
                        className="p-4 font-medium text-left text-muted-foreground"
                        key={h.id}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {pageRows.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-t [&:last-child>td]:border-b-0 transition-colors`}
                  >
                    {selectMode && (
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(p.id);
                                else next.delete(p.id);
                                return next;
                              });
                            }}
                          />
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          className={`p-1 rounded hover:bg-accent/20 ${p.starred ? "text-amber-500" : "text-muted-foreground"}`}
                          title={p.starred ? "Unstar" : "Star"}
                          onClick={(e) => {
                            e.stopPropagation();
                            table.options.meta?.toggleStar?.(p.id);
                          }}
                        >
                          <Star
                            className="w-4 h-4"
                            fill={p.starred ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          className="text-foreground hover:underline"
                          title="Open project"
                          onClick={() => openProject(p.slug || p.uid || p.id)}
                        >
                          {p.name}
                        </button>
                      </div>
                    </td>
                    <td className="p-4">{p.owner}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          p.status === "Active"
                            ? "info"
                            : p.status === "Completed"
                              ? "success"
                              : "warning"
                        }
                        pill
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-4">{p.deadline}</td>
                    {/* Time rollup */}
                    <td className="p-4">
                      {(() => {
                        const r = getProjectTimeRollup(p.id);
                        return (
                          <div className="flex items-center gap-2 text-[10px]">
                            <Badge variant="secondary" pill>
                              Est {r.estimate}h
                            </Badge>
                            <Badge variant="info" pill>
                              Log {r.logged}h
                            </Badge>
                            <Badge variant="warning" pill>
                              Rem {r.remaining}h
                            </Badge>
                          </div>
                        );
                      })()}
                    </td>
                    {/* Progress */}
                    <td className="p-4">
                      {(() => {
                        const t = getTaskCompletionForProject(p.id);
                        const fallback =
                          p.status === "Completed"
                            ? 100
                            : p.status === "Active"
                              ? 65
                              : p.status === "In Progress"
                                ? 40
                                : 20;
                        const percent = t.total > 0 ? t.percent : fallback;
                        return (
                          <div className="min-w-40">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>
                                {t.total > 0 ? `${t.done}/${t.total}` : "—"}
                              </span>
                              <span className="font-medium text-foreground">
                                {percent}%
                              </span>
                            </div>
                            <div className="h-2 bg-accent rounded-full overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-primary to-primary/60"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    {/* Members */}
                    <td className="p-4">
                      <div className="flex items-center">
                        {(p.members || []).slice(0, 5).map((m, idx) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={idx}
                            src={
                              m.avatarUrl ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
                            }
                            alt={m.name}
                            className="w-6 h-6 rounded-full border -ml-2 first:ml-0 bg-white"
                          />
                        ))}
                        {p.members && p.members.length > 5 && (
                          <div className="w-6 h-6 rounded-full border -ml-2 first:ml-0 bg-muted text-foreground text-[10px] flex items-center justify-center">
                            +{p.members.length - 5}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openProject(p.slug || p.uid || p.id)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/40"
                          onClick={() =>
                            setDeleteConfirm({ id: p.id, name: p.name })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-3 border-t text-sm">
            <div>
              Page {pageIndex + 1} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(0)}
                disabled={pageIndex === 0}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageIndex(Math.min(totalPages - 1, pageIndex + 1))
                }
                disabled={pageIndex >= totalPages - 1}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(totalPages - 1)}
                disabled={pageIndex >= totalPages - 1}
              >
                Last
              </Button>
            </div>
          </div>
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
            <p className="text-sm text-muted-foreground mb-2">
              Type the project name to confirm:
            </p>
            <input
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
    </div>
  );
}
