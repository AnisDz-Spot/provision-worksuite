"use client";
import React, { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { MetricCard } from "@/components/finance/MetricCard";

type Project = { id: string; name: string; revenue?: number };
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

export default function ProfitabilityPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, e, t] = await Promise.all([
        fetch(`/data/projects.json`).then((r) => r.json()),
        fetch(`/data/expenses.json`)
          .then((r) => r.json())
          .catch(() => []),
        fetch(`/data/timelogs.json`)
          .then((r) => r.json())
          .catch(() => []),
      ]);
      setProjects(p);
      setExpenses(e);
      setLogs(t);
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const byProject: Record<
      string,
      { expenses: number; time: number; revenue: number }
    > = {};
    for (const p of projects)
      byProject[p.id] = { expenses: 0, time: 0, revenue: p.revenue ?? 0 };
    for (const e of expenses) {
      if (!byProject[e.projectId])
        byProject[e.projectId] = { expenses: 0, time: 0, revenue: 0 };
      byProject[e.projectId].expenses += e.amount || 0;
    }
    for (const l of logs) {
      if (!byProject[l.projectId])
        byProject[l.projectId] = { expenses: 0, time: 0, revenue: 0 };
      byProject[l.projectId].time += (l.hours || 0) * (l.rate || 0);
    }
    return byProject;
  }, [projects, expenses, logs]);

  const totals = useMemo(() => {
    const revenue = projects.reduce((sum, p) => sum + (p.revenue ?? 0), 0);
    const costs = Object.values(metrics).reduce(
      (sum, m) => sum + m.expenses + m.time,
      0
    );
    const profit = revenue - costs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, costs, profit, margin };
  }, [projects, metrics]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Profitability" />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={`$${totals.revenue.toLocaleString()}`}
        />
        <MetricCard title="Costs" value={`$${totals.costs.toLocaleString()}`} />
        <MetricCard
          title="Profit"
          value={`$${totals.profit.toLocaleString()}`}
        />
        <MetricCard title="Margin" value={`${totals.margin.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const m = metrics[p.id] || {
            expenses: 0,
            time: 0,
            revenue: p.revenue ?? 0,
          };
          const profit = (p.revenue ?? 0) - (m.expenses + m.time);
          const positive = profit >= 0;
          return (
            <div key={p.id} className="rounded-lg border p-4 space-y-2">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">
                Revenue: ${Number(p.revenue ?? 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Costs: ${(m.expenses + m.time).toLocaleString()}
              </div>
              <div
                className={`text-sm font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}
              >
                Profit: ${profit.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
