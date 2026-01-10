"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resource: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  details: any;
}

export function AuditLogTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/audit-logs?page=${page}&limit=10`;
      if (actionFilter && actionFilter !== "ALL") {
        url += `&action=${actionFilter}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const getActionColor = (action: string) => {
    if (action.includes("LOGIN")) return "default";
    if (action.includes("DELETE")) return "destructive";
    if (action.includes("UPDATE")) return "secondary";
    if (action.includes("CREATE")) return "outline";
    if (action.includes("2FA")) return "secondary";
    return "secondary";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <Input placeholder="Search users..." className="max-w-xs" disabled />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="FAILED_LOGIN">Failed Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE_PROJECT">Create Project</option>
            <option value="DELETE_PROJECT">Delete Project</option>
            <option value="UPDATE_SETTINGS">System Settings</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  Time
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  User
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  Action
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  Resource
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">
                  IP Address
                </th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td colSpan={6} className="h-24 text-center align-middle">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading audit trail...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <td
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground align-middle"
                  >
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle whitespace-nowrap font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.user.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={getActionColor(log.action) as any}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                      {log.resource || "-"}
                    </td>
                    <td className="p-4 align-middle font-mono text-xs">
                      {log.ipAddress || "Unknown"}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="sr-only">View Details</span>
                        ...
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
