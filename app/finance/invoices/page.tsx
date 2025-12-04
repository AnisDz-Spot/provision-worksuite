"use client";
import React, { useEffect, useMemo, useState } from "react";
// Assuming these components are available in the project structure
import { Modal } from "@/components/ui/Modal";
// Assuming these are custom components or next/navigation
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { MetricCard } from "@/components/finance/MetricCard";

// Assuming types are defined elsewhere or need to be included here for the component to work
type Project = {
  id: string;
  name: string;
};
type Expense = {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  date: string;
};
type TimeLog = {
  id: string;
  projectId: string;
  userId: string;
  hours: number;
  rate: number;
  date: string;
};
type Invoice = {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  status: "draft" | "sent" | "paid";
};

export default function InvoicesPage() {
  // State for the "Add Invoice" modal
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    projectId: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    status: "draft",
  });

  // Main state for the page data
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filters, setFilters] = useState<{
    projectId: string;
    status: "" | "draft" | "sent" | "paid";
    q: string;
    from: string;
    to: string;
  }>({ projectId: "", status: "", q: "", from: "", to: "" });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fix: handleAddInvoice function must be inside the component
  const handleAddInvoice = async () => {
    setAddError(null);
    if (!newInvoice.projectId || !newInvoice.amount) {
      setAddError("Project and amount are required.");
      return;
    }
    setAddLoading(true);
    const invoiceObj: Invoice = {
      // Explicitly set the type to Invoice
      id: `inv_${Date.now()}`,
      projectId: newInvoice.projectId, // Added missing property
      date: newInvoice.date, // Added missing property
      amount: parseFloat(newInvoice.amount), // Added missing property
      status: newInvoice.status as Invoice["status"], // Added missing property
    };
    try {
      // Try API first
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceObj),
      });
      const data = await res.json();
      if (data?.success) {
        setInvoices((prev) => [data.data, ...prev]);
        setAddOpen(false);
        setNewInvoice({
          projectId: "",
          amount: "",
          date: new Date().toISOString().slice(0, 10),
          status: "draft",
        });
        setAddLoading(false);
        return;
      }
      throw new Error("DB not configured");
    } catch {
      // Fallback to local state
      setInvoices((prev) => [invoiceObj, ...prev]);
      setAddOpen(false);
      setNewInvoice({
        projectId: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        status: "draft",
      });
      setAddLoading(false);
    }
  };

  // Data Loading Effect
  useEffect(() => {
    const load = async () => {
      const pData = await fetch(`/data/projects.json`).then((r) => r.json());
      setProjects(pData);

      // Expenses
      try {
        const res = await fetch("/api/expenses").then((r) => r.json());
        if (res?.success && res.data) {
          const dbExpenses = res.data.map((e: any) => ({
            id: String(e.id),
            projectId: e.project_id || "",
            description: e.note || e.vendor || "",
            amount: parseFloat(e.amount),
            date: e.date,
          }));
          setExpenses(dbExpenses);
        } else {
          throw new Error("DB not configured");
        }
      } catch {
        const e = await fetch(`/data/expenses.json`)
          .then((r) => r.json())
          .catch(() => []);
        setExpenses(
          e.map((exp: any) => ({
            ...exp,
            description: exp.note || exp.vendor || "",
          }))
        );
      }

      // Time logs
      try {
        const res = await fetch("/api/time-logs").then((r) => r.json());
        if (res?.success && res.data) {
          const dbLogs = res.data.map((log: any) => ({
            id: String(log.id),
            projectId: log.project_id || "",
            userId: log.user_id || "",
            hours: parseFloat(log.hours),
            rate: parseFloat(log.rate || 0),
            date: log.date,
          }));
          setLogs(dbLogs);
        } else {
          throw new Error("DB not configured");
        }
      } catch {
        const t = await fetch(`/data/timelogs.json`)
          .then((r) => r.json())
          .catch(() => []);
        setLogs(
          t.map((log: any) => ({
            ...log,
            userId: log.userId || "",
            rate: log.rate || 0,
          }))
        );
      }

      // Invoices
      try {
        const res = await fetch("/api/invoices").then((r) => r.json());
        if (res?.success && res.data) {
          const dbInvoices = res.data.map((inv: any) => ({
            id: String(inv.id),
            projectId: inv.project_id || "",
            date: inv.date,
            amount: parseFloat(inv.amount),
            status: inv.status || "draft",
          }));
          setInvoices(dbInvoices);
        } else {
          throw new Error("DB not configured");
        }
      } catch {
        const i = await fetch(`/data/invoices.json`)
          .then((r) => r.json())
          .catch(() => []);
        setInvoices(i);
      }
    };
    load();
  }, []);

  // Initialize filters from URL or localStorage
  useEffect(() => {
    try {
      const fromUrl = {
        projectId: searchParams.get("project") || "",
        status: (searchParams.get("status") as "draft" | "sent" | "paid") || "",
        q: searchParams.get("q") || "",
        from: searchParams.get("from") || "",
        to: searchParams.get("to") || "",
      };
      if (Object.values(fromUrl).some(Boolean)) {
        setFilters(fromUrl);
        return;
      }
      const raw = localStorage.getItem("pv:invoiceFilters");
      if (raw) setFilters(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to localStorage and URL
  useEffect(() => {
    try {
      localStorage.setItem("pv:invoiceFilters", JSON.stringify(filters));
    } catch {}
    const params = new URLSearchParams();
    if (filters.projectId) params.set("project", filters.projectId);
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : `${pathname}`,
      { scroll: false }
    );
  }, [filters, pathname, router]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (filters.projectId && inv.projectId !== filters.projectId)
        return false;
      if (filters.status && inv.status !== filters.status) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const projectName =
          projects.find((p) => p.id === inv.projectId)?.name || inv.projectId;
        if (
          !inv.id.toLowerCase().includes(q) &&
          !projectName.toLowerCase().includes(q)
        )
          return false;
      }
      const d = new Date(inv.date).toISOString().slice(0, 10);
      if (filters.from && d < filters.from) return false;
      if (filters.to && d > filters.to) return false;
      return true;
    });
  }, [invoices, filters, projects]);

  const byProjectTotals = useMemo(() => {
    const map: Record<string, { expenses: number; time: number }> = {};
    for (const e of expenses) {
      map[e.projectId] = map[e.projectId] || { expenses: 0, time: 0 };
      map[e.projectId].expenses += e.amount || 0;
    }
    for (const l of logs) {
      map[l.projectId] = map[l.projectId] || { expenses: 0, time: 0 };
      map[l.projectId].time += (l.hours || 0) * (l.rate || 0);
    }
    return map;
  }, [expenses, logs]);

  const createInvoice = (projectId: string) => {
    const totals = byProjectTotals[projectId] || { expenses: 0, time: 0 };
    const amount = totals.expenses + totals.time;
    const inv: Invoice = {
      id: `inv_${Date.now()}`,
      projectId,
      date: new Date().toISOString(),
      amount,
      status: "draft",
    };
    setInvoices((prev) => [inv, ...prev]);
  };

  const exportInvoice = (inv: Invoice) => {
    const project =
      projects.find((p) => p.id === inv.projectId)?.name || inv.projectId;
    const content = `Invoice ${inv.id}\nProject: ${project}\nDate: ${new Date(inv.date).toLocaleDateString()}\nAmount: $${inv.amount.toLocaleString()}\nStatus: ${inv.status}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setStatus = (id: string, status: Invoice["status"]) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  const totals = useMemo(() => {
    const total = filteredInvoices.reduce((s, i) => s + (i.amount || 0), 0);
    const paid = filteredInvoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + (i.amount || 0), 0);
    const outstanding = total - paid;
    return { count: filteredInvoices.length, total, paid, outstanding };
  }, [filteredInvoices]);

  const downloadCSV = () => {
    const header = ["id", "project", "date", "amount", "status"];
    const rows = filteredInvoices.map((i) => [
      i.id,
      projects.find((p) => p.id === i.projectId)?.name || i.projectId,
      new Date(i.date).toISOString().slice(0, 10),
      String(i.amount),
      i.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 relative">
      {/* The floating button has been removed from here.
        
        <Button
          className="fixed bottom-8 right-8 z-30 shadow-lg"
          size="lg"
          onClick={() => setAddOpen(true)}
        >
          + Add Invoice
        </Button> 
      */}
      {/* Add Invoice Modal */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        size="sm"
        className="md:min-w-[40vw]"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Add Invoice</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Project</label>
            <select
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
              value={newInvoice.projectId}
              onChange={(e) =>
                setNewInvoice((v) => ({ ...v, projectId: e.target.value }))
              }
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Amount</label>
            <Input
              type="number"
              min="0"
              value={newInvoice.amount}
              onChange={(e) =>
                setNewInvoice((v) => ({ ...v, amount: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={newInvoice.date}
              onChange={(e) =>
                setNewInvoice((v) => ({ ...v, date: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Status</label>
            <select
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
              value={newInvoice.status}
              onChange={(e) =>
                setNewInvoice((v) => ({
                  ...v,
                  status: e.target.value as Invoice["status"],
                }))
              }
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          {addError && (
            <div className="text-destructive text-sm">{addError}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAddInvoice}
              loading={addLoading}
              className="flex-1"
            >
              Add
            </Button>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
      {/* SectionHeader updated to include the "Add Invoice" button */}
      <SectionHeader
        title="Invoices"
        right={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              + Add Invoice
            </Button>
            <Button size="sm" onClick={downloadCSV}>
              CSV
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Count" value={totals.count} />
        <MetricCard title="Total" value={`$${totals.total.toLocaleString()}`} />
        <MetricCard title="Paid" value={`$${totals.paid.toLocaleString()}`} />
        <MetricCard
          title="Outstanding"
          value={`$${totals.outstanding.toLocaleString()}`}
        />
      </div>
      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-3">
          Create invoice from totals
        </div>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => createInvoice(p.id)}
              className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm"
            >
              New for {p.name}
            </button>
          ))}
        </div>
      </div>
      {/* Filters */}
      <div className="rounded-lg border p-4">
        <div className="grid md:grid-cols-6 gap-3">
          <select
            aria-label="Filter by project"
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
            value={filters.projectId}
            onChange={(e) =>
              setFilters({ ...filters, projectId: e.target.value })
            }
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Status"
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value as any })
            }
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
          </select>
          <Input
            aria-label="Search id or project"
            placeholder="Search id or project..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <Input
            aria-label="From date"
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          />
          <Input
            aria-label="To date"
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          />
          <Button
            variant="outline"
            onClick={() =>
              setFilters({ projectId: "", status: "", q: "", from: "", to: "" })
            }
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/70 text-muted-foreground">
            <tr>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Date</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3 align-top font-medium">{inv.id}</td>
                <td className="p-3 align-top">
                  {projects.find((p) => p.id === inv.projectId)?.name ||
                    inv.projectId}
                </td>
                <td className="p-3 align-top">
                  {new Date(inv.date).toLocaleDateString()}
                </td>
                <td className="p-3 align-top text-right">
                  ${inv.amount.toLocaleString()}
                </td>
                <td className="p-3 align-top">
                  <select
                    value={inv.status}
                    onChange={(e) =>
                      setStatus(inv.id, e.target.value as Invoice["status"])
                    }
                    className="border rounded px-2 py-1 bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                  </select>
                </td>
                <td className="p-3 align-top text-right">
                  <button
                    onClick={() => exportInvoice(inv)}
                    className="px-2 py-1 text-sm rounded bg-muted"
                  >
                    Export
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
