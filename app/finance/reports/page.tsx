"use client";
import React, { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { MetricCard } from "@/components/finance/MetricCard";
import { ProgressBar } from "@/components/finance/ProgressBar";

type Project = { id: string; name: string; budget?: number; revenue?: number };
type Expense = { id: string; projectId: string; amount: number; date: string };
type TimeLog = {
  id: string;
  projectId: string;
  hours: number;
  rate: number;
  date: string;
};

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);

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
        setExpenses(e);
      }

      // Time logs
      try {
        const res = await fetch("/api/time-logs").then((r) => r.json());
        if (res?.success && res.data) {
          const dbLogs = res.data.map((log: any) => ({
            id: String(log.id),
            projectId: log.project_id || "",
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
            rate: log.rate || 0,
          }))
        );
      }
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const revenue = projects.reduce((s, p) => s + (p.revenue ?? 0), 0);
    const costs =
      logs.reduce((s, l) => s + (l.hours || 0) * (l.rate || 0), 0) +
      expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const profit = revenue - costs;
    const budget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
    const used = costs;
    const pct =
      budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
    return { revenue, costs, profit, budget, used, pct };
  }, [projects, expenses, logs]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Reports" />
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
        <MetricCard title="Budget Used" value={`${totals.pct}%`} />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="text-sm font-medium">Budget Utilization</div>
        <ProgressBar
          percent={totals.pct}
          color={
            totals.pct < 80
              ? "success"
              : totals.pct < 100
                ? "warning"
                : "danger"
          }
        />
        <div className="text-xs text-muted-foreground">
          Used ${totals.used.toLocaleString()} of $
          {totals.budget.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
