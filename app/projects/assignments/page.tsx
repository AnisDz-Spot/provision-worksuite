import { getAuthenticatedUser } from "@/lib/auth";
import { AssignmentTable } from "@/components/projects/AssignmentTable";
import { redirect } from "next/navigation";
import React from "react";

export default async function AssignmentsPage() {
  // SECURITY: Server-side authentication check
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    redirect("/login");
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
