"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { isAdmin, isProjectManager, AuthUser } from "@/lib/auth-utils";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Assignment {
  id: string;
  projectId: number;
  userId: number;
  role: string;
  joinedAt: string;
  invitationAcceptedAt: string | null;
  project: {
    id: number;
    uid: string;
    name: string;
    slug: string | null;
  };
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  inviter: {
    id: number;
    name: string;
    email: string;
  } | null;
  totalLoggedHours: number;
}

export function AssignmentTable() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState({
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Redirect if not authorized
  useEffect(() => {
    if (currentUser) {
      // Safe cast or mapping if needed, simplified for now
      const authUser = currentUser as unknown as AuthUser;
      if (!isAdmin(authUser) && !isProjectManager(authUser)) {
        router.push("/dashboard");
      }
    }
  }, [currentUser, router]);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithCsrf(
        `/api/projects/assignments?page=${page}&limit=10`
      );
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setMetadata(json.pagination);
      } else {
        setError(json.error || "Failed to fetch assignments");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAssignments();
    }
  }, [currentUser, page]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md border border-red-200 dark:border-red-900">
        Error: {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Project Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium">
                <tr>
                  <th className="h-12 px-4 align-middle">User</th>
                  <th className="h-12 px-4 align-middle">Project</th>
                  <th className="h-12 px-4 align-middle">Role</th>
                  <th className="h-12 px-4 align-middle">Invited By</th>
                  <th className="h-12 px-4 align-middle">Sent / Accepted</th>
                  <th className="h-12 px-4 align-middle text-right">
                    Task Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-secondary">
                          {assignment.user.avatarUrl ? (
                            <img
                              src={assignment.user.avatarUrl}
                              alt={assignment.user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium">
                              {assignment.user.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {assignment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {assignment.user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {assignment.project.name}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="secondary" className="capitalize">
                        {assignment.role}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {assignment.inviter ? (
                        <div className="text-sm">{assignment.inviter.name}</div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col text-xs">
                        <span
                          className="text-muted-foreground"
                          title="Joined/Invited"
                        >
                          Sent: {formatDate(assignment.joinedAt)}
                        </span>
                        {assignment.invitationAcceptedAt ? (
                          <span className="text-green-600 dark:text-green-400 font-medium mt-0.5">
                            Accepted:{" "}
                            {formatDate(assignment.invitationAcceptedAt)}
                          </span>
                        ) : (
                          <span className="text-amber-500 font-medium mt-0.5">
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="font-mono font-medium">
                        {assignment.totalLoggedHours.toFixed(1)}h
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="h-24 text-center align-middle">
                      No assignments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {metadata.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {page} of {metadata.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(metadata.totalPages, p + 1))
              }
              disabled={page === metadata.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
