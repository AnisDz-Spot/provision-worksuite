"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { AssignmentTable } from "@/components/projects/AssignmentTable";
import { Loader2 } from "lucide-react";
import React from "react";

export default function AssignmentsPage() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Project Assignments
        </h1>
        <p className="text-muted-foreground mt-2">
          Audit log of all project assignments and invitations.
        </p>
      </div>

      <AssignmentTable />
    </div>
  );
}
