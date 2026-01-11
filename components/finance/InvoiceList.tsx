"use client";

import { useEffect, useState } from "react";
import { generateInvoicePDF } from "@/lib/pdf-generator";
// Table components not available, using standard HTML
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Plus, FileText, Download, Trash2, Mail } from "lucide-react";
import { useToaster } from "@/components/ui/Toaster";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface Invoice {
  id: number;
  uid: string;
  clientName: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
}

interface InvoiceListProps {
  projectId: number;
}

export function InvoiceList({ projectId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToaster();

  useEffect(() => {
    loadInvoices();
  }, [projectId]);

  async function loadInvoices() {
    try {
      const res = await fetch(`/api/invoices?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error(error);
      show("error", "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetchWithCsrf(`/api/invoices/${uid}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      show("success", "Invoice deleted");
      loadInvoices();
    } catch (error) {
      show("error", "Failed to delete");
    }
  };

  const handleSendEmail = async (uid: string) => {
    if (!confirm("Send this invoice to the client via email?")) return;
    try {
      show("info", "Sending email...");
      const res = await fetchWithCsrf(`/api/invoices/${uid}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      show("success", "Email sent successfully");
      loadInvoices(); // Refresh status
    } catch (error: any) {
      console.error(error);
      show("error", error.message || "Failed to send email");
    }
  };

  const handleDownload = async (uid: string) => {
    try {
      show("success", "Generating PDF...");
      const res = await fetch(`/api/invoices/${uid}`);
      if (!res.ok) throw new Error("Failed to fetch invoice");
      const json = await res.json();
      if (json.success) {
        generateInvoicePDF(json.data);
      }
    } catch (error) {
      console.error(error);
      show("error", "Failed to generate PDF");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "success";
      case "sent":
        return "info";
      case "overdue":
        return "destructive";
      case "draft":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading)
    return <div className="p-4 text-center">Loading invoices...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Invoices
        </h3>
        <Button
          size="sm"
          onClick={() => alert("Create Invoice Modal would open here")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No invoices found for this project.
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Status</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr
                  key={inv.uid}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <td className="p-3 font-medium">{inv.clientName}</td>
                  <td className="p-3">
                    <Badge
                      variant={getStatusColor(inv.status) as any}
                      className="capitalize"
                    >
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="p-3">{formatDate(inv.issueDate)}</td>
                  <td className="p-3 text-muted-foreground">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Send Email"
                        onClick={() => handleSendEmail(inv.uid)}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Download PDF"
                        onClick={() => handleDownload(inv.uid)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(inv.uid)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
