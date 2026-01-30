"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FileText, Plus, Download } from "lucide-react";

type Invoice = {
  id: string;
  projectId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue";
  items: { description: string; amount: number }[];
  total: number;
};
type Project = { id: string; name: string };

interface InvoiceTrackerProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  projects: Project[];
  currency: (n: number) => string;
  onNewInvoice: () => void;
  onExportPDF: (invoice: Invoice) => void;
}

export function InvoiceTracker({
  invoices,
  setInvoices,
  projects,
  currency,
  onNewInvoice,
  onExportPDF,
}: InvoiceTrackerProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <h2 className="text-lg font-semibold">Invoices</h2>
        </div>
        <Button onClick={onNewInvoice}>
          <Plus className="w-4 h-4 mr-2" />
          New Invoice
        </Button>
      </div>
      <div className="space-y-2">
        {invoices.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            No invoices yet. Create your first invoice!
          </div>
        )}
        {invoices.map((inv) => {
          const proj = projects.find((p) => p.id === inv.projectId);
          const isOverdue =
            inv.status !== "Paid" && new Date(inv.dueDate) < new Date();
          return (
            <Card
              key={inv.id}
              className="p-3 flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    inv.status === "Paid"
                      ? "default"
                      : isOverdue
                        ? "warning"
                        : "secondary"
                  }
                >
                  {inv.status}
                </Badge>
                <span className="font-medium text-nowrap">{inv.id}</span>
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {inv.clientName}
                </span>
                <span className="text-xs">{proj?.name || inv.projectId}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{currency(inv.total)}</span>
                <span className="text-xs text-muted-foreground hidden md:inline">
                  Due: {inv.dueDate}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportPDF(inv)}
                >
                  <Download className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <select
                  value={inv.status}
                  onChange={(e) =>
                    setInvoices(
                      invoices.map((i) =>
                        i.id === inv.id
                          ? {
                              ...i,
                              status: e.target.value as Invoice["status"],
                            }
                          : i,
                      ),
                    )
                  }
                  className="px-2 py-1 border rounded text-xs bg-background"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
