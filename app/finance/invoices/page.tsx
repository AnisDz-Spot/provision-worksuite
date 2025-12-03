"use client";
import React, { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { MetricCard } from "@/components/finance/MetricCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Project = { id: string; name: string };
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

  useEffect(() => {
    const load = async () => {
      const [p, e, t, i] = await Promise.all([
        fetch(`/data/projects.json`).then((r) => r.json()),
        fetch(`/data/expenses.json`)
          .then((r) => r.json())
          .catch(() => []),
        fetch(`/data/timelogs.json`)
          .then((r) => r.json())
          .catch(() => []),
        fetch(`/data/invoices.json`)
          .then((r) => r.json())
          .catch(() => []),
      ]);
      setProjects(p);
      setExpenses(e);
      setLogs(t);
      setInvoices(i);
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
    <div className="space-y-6">
      <SectionHeader
        title="Invoices"
        right={
          <Button size="sm" onClick={downloadCSV}>
            CSV
          </Button>
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
