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

export default function ExpensesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filters, setFilters] = useState<{
    projectId: string;
    q: string;
    from: string;
    to: string;
  }>({ projectId: "", q: "", from: "", to: "" });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const load = async () => {
      const [p, e] = await Promise.all([
        fetch(`/data/projects.json`).then((r) => r.json()),
        fetch(`/data/expenses.json`)
          .then((r) => r.json())
          .catch(() => []),
      ]);
      setProjects(p);
      setExpenses(e);
    };
    load();
  }, []);

  // Initialize filters from URL or localStorage
  useEffect(() => {
    try {
      const fromUrl = {
        projectId: searchParams.get("project") || "",
        q: searchParams.get("q") || "",
        from: searchParams.get("from") || "",
        to: searchParams.get("to") || "",
      };
      const hasUrl = Object.values(fromUrl).some(Boolean);
      if (hasUrl) {
        setFilters(fromUrl);
        return;
      }
      const raw = localStorage.getItem("pv:expensesFilters");
      if (raw) setFilters(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to localStorage and URL
  useEffect(() => {
    try {
      localStorage.setItem("pv:expensesFilters", JSON.stringify(filters));
    } catch {}
    const params = new URLSearchParams();
    if (filters.projectId) params.set("project", filters.projectId);
    if (filters.q) params.set("q", filters.q);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : `${pathname}`, { scroll: false });
  }, [filters, pathname, router]);

  const byProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.projectId] = (map[e.projectId] || 0) + (e.amount || 0);
    }
    return map;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filters.projectId && e.projectId !== filters.projectId) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const inDesc = (e as any).description?.toLowerCase().includes(q);
        const inNote = (e as any).note?.toLowerCase().includes(q);
        if (!inDesc && !inNote) return false;
      }
      if (filters.from && e.date < filters.from) return false;
      if (filters.to && e.date > filters.to) return false;
      return true;
    });
  }, [expenses, filters]);

  const byProjectFiltered = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filteredExpenses) {
      map[e.projectId] = (map[e.projectId] || 0) + (e.amount || 0);
    }
    return map;
  }, [filteredExpenses]);

  const download = () => {
    const blob = new Blob([JSON.stringify(expenses, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const header = ["date", "project", "description", "amount"];
    const rows = filteredExpenses.map((e) => [
      e.date,
      projects.find((p) => p.id === e.projectId)?.name || e.projectId,
      (e as any).description || "",
      String(e.amount),
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) =>
            typeof v === "string" && (v.includes(",") || v.includes('"'))
              ? `"${String(v).replaceAll('"', '""')}"`
              : String(v)
          )
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "[]"));
        setExpenses(Array.isArray(data) ? data : []);
      } catch {}
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Expenses"
        right={
          <>
            <Button size="sm" onClick={download}>
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={downloadCSV}>
              CSV
            </Button>
            <label className="px-3 py-2 rounded bg-muted text-sm cursor-pointer">
              Import
              <input
                type="file"
                accept="application/json"
                onChange={onImport}
                className="hidden"
              />
            </label>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <MetricCard
            key={p.id}
            title={p.name}
            value={`$${Number(byProjectFiltered[p.id] ?? byProject[p.id] ?? 0).toLocaleString()}`}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border p-4">
        <div className="grid md:grid-cols-5 gap-3">
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
          <Input
            aria-label="Description contains"
            placeholder="Description contains..."
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
              setFilters({ projectId: "", q: "", from: "", to: "" })
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
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Project</th>
              <th className="text-left p-3">Description</th>
              <th className="text-right p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3 align-top">
                  {new Date(e.date).toLocaleDateString()}
                </td>
                <td className="p-3 align-top">
                  {projects.find((p) => p.id === e.projectId)?.name ||
                    e.projectId}
                </td>
                <td className="p-3 align-top">{(e as any).description}</td>
                <td className="p-3 align-top text-right">
                  ${e.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
