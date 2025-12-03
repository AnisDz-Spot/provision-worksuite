"use client";
import React, { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { ProgressBar } from "@/components/finance/ProgressBar";

type Project = {
  id: string;
  name: string;
  budget?: number;
  revenue?: number;
  hourlyRate?: number;
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

export default function BudgetsPage() {
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

  const totals = useMemo(() => {
    const byProject: Record<
      string,
      { expenseTotal: number; timeCost: number }
    > = {};
    for (const p of projects)
      byProject[p.id] = { expenseTotal: 0, timeCost: 0 };
    for (const e of expenses) {
      if (!byProject[e.projectId])
        byProject[e.projectId] = { expenseTotal: 0, timeCost: 0 };
      byProject[e.projectId].expenseTotal += e.amount || 0;
    }
    for (const l of logs) {
      if (!byProject[l.projectId])
        byProject[l.projectId] = { expenseTotal: 0, timeCost: 0 };
      byProject[l.projectId].timeCost += (l.hours || 0) * (l.rate || 0);
    }
    return byProject;
  }, [projects, expenses, logs]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Budgets" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const expenseTotal = totals[p.id]?.expenseTotal || 0;
          const timeCost = totals[p.id]?.timeCost || 0;
          const budget = p.budget ?? 0;
          const spent = expenseTotal + timeCost;
          const pct =
            budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
          const status =
            budget === 0
              ? "No budget"
              : pct < 80
                ? "Healthy"
                : pct < 100
                  ? "Warning"
                  : "Over";
          return (
            <div
              key={p.id}
              className="rounded-lg border bg-card text-card-foreground p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                  {status}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Budget: ${budget.toLocaleString()} • Spent: $
                {spent.toLocaleString()}
              </div>
              <ProgressBar
                percent={pct}
                color={pct < 80 ? "success" : pct < 100 ? "warning" : "danger"}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pct}% used</span>
                <span>Remaining: ${(budget - spent).toLocaleString()}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Time cost: ${timeCost.toLocaleString()} • Expenses: $
                {expenseTotal.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
