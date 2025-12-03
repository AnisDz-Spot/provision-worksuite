"use client";
import React, { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { MetricCard } from "@/components/finance/MetricCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Project = { id: string; name: string; hourlyRate?: number };
type TimeLog = {
  id: string;
  projectId: string;
  userId: string;
  hours: number;
  rate: number;
  date: string;
};

export default function BillingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [filters, setFilters] = useState<{
    projectId: string;
    user: string;
    from: string;
    to: string;
  }>({ projectId: "", user: "", from: "", to: "" });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const load = async () => {
      const [p, t] = await Promise.all([
        fetch(`/data/projects.json`).then((r) => r.json()),
        fetch(`/data/timelogs.json`)
          .then((r) => r.json())
          .catch(() => []),
      ]);
      setProjects(p);
      setLogs(t);
    };
    load();
  }, []);

  // Initialize filters from URL or localStorage
  useEffect(() => {
    try {
      const fromUrl = {
        projectId: searchParams.get("project") || "",
        user: searchParams.get("user") || "",
        from: searchParams.get("from") || "",
        to: searchParams.get("to") || "",
      };
      if (Object.values(fromUrl).some(Boolean)) {
        setFilters(fromUrl);
        return;
      }
      const raw = localStorage.getItem("pv:billingFilters");
      if (raw) setFilters(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to localStorage and URL
  useEffect(() => {
    try {
      localStorage.setItem("pv:billingFilters", JSON.stringify(filters));
    } catch {}
    const params = new URLSearchParams();
    if (filters.projectId) params.set("project", filters.projectId);
    if (filters.user) params.set("user", filters.user);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : `${pathname}`,
      { scroll: false }
    );
  }, [filters, pathname, router]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (filters.projectId && l.projectId !== filters.projectId) return false;
      if (
        filters.user &&
        !(l.userId || "").toLowerCase().includes(filters.user.toLowerCase())
      )
        return false;
      if (filters.from && l.date < filters.from) return false;
      if (filters.to && l.date > filters.to) return false;
      return true;
    });
  }, [logs, filters]);

  const byProject = useMemo(() => {
    const map: Record<string, { hours: number; billable: number }> = {};
    for (const p of projects) map[p.id] = { hours: 0, billable: 0 };
    for (const l of filteredLogs) {
      if (!map[l.projectId]) map[l.projectId] = { hours: 0, billable: 0 };
      map[l.projectId].hours += l.hours || 0;
      map[l.projectId].billable += (l.hours || 0) * (l.rate || 0);
    }
    return map;
  }, [projects, filteredLogs]);

  const totals = useMemo(() => {
    const hours = Object.values(byProject).reduce((s, m) => s + m.hours, 0);
    const billable = Object.values(byProject).reduce(
      (s, m) => s + m.billable,
      0
    );
    return { hours, billable };
  }, [byProject]);

  const downloadCSV = () => {
    const header = ["date", "project", "user", "hours", "rate", "amount"];
    const rows = filteredLogs.map((l) => {
      const amount = (l.hours || 0) * (l.rate || 0);
      return [
        l.date,
        projects.find((p) => p.id === l.projectId)?.name || l.projectId,
        l.userId || "",
        String(l.hours || 0),
        String(l.rate || 0),
        String(amount),
      ];
    });
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timelogs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Time-based Billing"
        subtitle="Project hours and billable amounts"
        right={
          <Button size="sm" onClick={downloadCSV}>
            CSV
          </Button>
        }
      />
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
            aria-label="User contains"
            placeholder="User contains..."
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
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
              setFilters({ projectId: "", user: "", from: "", to: "" })
            }
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Total Hours" value={totals.hours.toFixed(2)} />
        <MetricCard
          title="Total Billable"
          value={`$${totals.billable.toLocaleString()}`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const m = byProject[p.id] || { hours: 0, billable: 0 };
          const rate = p.hourlyRate ?? 0;
          return (
            <div
              key={p.id}
              className="rounded-lg border bg-card text-card-foreground p-4 space-y-3"
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">
                Hours: {m.hours.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                Billable: ${m.billable.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Default rate: ${rate}/hr
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
