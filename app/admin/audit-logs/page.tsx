import { Metadata } from "next";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Audit Logs | Admin | ProVision WorkSuite",
  description: "View system security and activity logs",
};

export default function AuditLogsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track security events, user actions, and system changes for compliance
          and monitoring.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing recent system activities. Use filters to narrow down by user
            or action.
          </p>
        </CardHeader>
        <CardContent>
          <AuditLogTable />
        </CardContent>
      </Card>
    </div>
  );
}
