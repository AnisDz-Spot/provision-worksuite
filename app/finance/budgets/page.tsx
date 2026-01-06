"use client";
import React, { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { useLoading } from "@/context/LoadingContext";
import { loadProjects, loadTasks } from "@/lib/data";
import { shouldUseMockData } from "@/lib/dataSource";
import { fetchWithCsrf } from "@/lib/csrf-client";

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
  const { showLoader, hideLoader } = useLoading();

  useEffect(() => {
    const load = async () => {
      showLoader("Loading budget data...");
      try {
        // Load Projects
        const pData = await loadProjects();
        setProjects(pData as any);

        // Load Expenses
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
          // Only show mock expenses if explicitly in mock mode
          if (shouldUseMockData()) {
            const e = await fetch(`/data/expenses.json`)
              .then((r) => r.json())
              .catch(() => []);
            setExpenses(
              e.map((exp: any) => ({
                ...exp,
                description: exp.note || exp.vendor || "",
              }))
            );
          } else {
            setExpenses([]);
          }
        }

        // Load Time Logs
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
          if (shouldUseMockData()) {
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
          } else {
            setLogs([]);
          }
        }
      } catch (err) {
        console.error("Failed to load budget data:", err);
      } finally {
        hideLoader();
      }
    };
    load();
  }, [showLoader, hideLoader]);

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
        {projects.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-accent/20 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">No Budgets Found</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              You haven't set up any project budgets yet. Budgets allow you to
              track project health against expenses and time logs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl text-left mb-8">
              <div className="p-4 rounded-lg bg-card border shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">
                    1
                  </span>
                  Create a Project
                </h4>
                <p className="text-xs text-muted-foreground">
                  Go to the Projects page and click "+ New Project".
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">
                    2
                  </span>
                  Set a Budget
                </h4>
                <p className="text-xs text-muted-foreground">
                  Enter an amount in the "Budget (USD)" field during creation.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">
                    3
                  </span>
                  Log Expenses
                </h4>
                <p className="text-xs text-muted-foreground">
                  Add project expenses in the Expenses tab to track costs.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-card border shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px]">
                    4
                  </span>
                  Track Time
                </h4>
                <p className="text-xs text-muted-foreground">
                  Use the time log widget; team member rates define time costs.
                </p>
              </div>
            </div>

            <a
              href="/projects/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Create Your First Project
            </a>
          </div>
        ) : (
          projects.map((p) => {
            const expenseTotal = totals[p.id]?.expenseTotal || 0;
            const timeCost = totals[p.id]?.timeCost || 0;
            const budget = p.budget ?? 0;
            const spent = expenseTotal + timeCost;
            const pct =
              budget > 0
                ? Math.min(100, Math.round((spent / budget) * 100))
                : 0;
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
                  color={
                    pct < 80 ? "success" : pct < 100 ? "warning" : "danger"
                  }
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
          })
        )}
      </div>
    </div>
  );
}
