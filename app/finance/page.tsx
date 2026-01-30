"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  Settings,
  AlertTriangle,
  Bell,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { log } from "@/lib/logger";

// Actions
import { createInvoice as createInvoiceAction } from "@/actions/finance";

// Components
import { FinancialSummary } from "@/components/finance/FinancialSummary";
import { FinancialForecast } from "@/components/finance/FinancialForecast";
import { ExpenseTracker } from "@/components/finance/ExpenseTracker";
import { TimeLogTracker } from "@/components/finance/TimeLogTracker";
import { ProfitabilityAnalysis } from "@/components/finance/ProfitabilityAnalysis";
import { InvoiceTracker } from "@/components/finance/InvoiceTracker";
import { FinanceModals } from "@/components/finance/FinanceModals";
import { BudgetTracker } from "@/components/finance/BudgetTracker";

// Types
type Project = {
  id: string;
  name: string;
  budget?: number;
  hourlyRate?: number;
  revenue?: number;
  alertThresholds?: number[];
};
type Expense = {
  id: string;
  projectId: string;
  date: string;
  vendor: string;
  amount: number;
  note?: string;
};
type TimeLog = { id: string; projectId: string; date: string; hours: number };
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

export default function FinancePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "info" | "warning" | "error" }>
  >([]);
  const [budgetAlerts, setBudgetAlerts] = useState<Record<string, number[]>>(
    {},
  );

  // Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    projectId: "",
    clientName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });

  // Utils
  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const pushToast = (
    message: string,
    type: "info" | "warning" | "error" = "info",
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  // Data Fetching
  useEffect(() => {
    const load = async () => {
      const { shouldUseDatabaseData, shouldUseMockData } =
        await import("@/lib/dataSource");
      const useDb = shouldUseDatabaseData();
      const isMock = shouldUseMockData();

      // Projects
      try {
        if (useDb) {
          const res = await fetch("/api/projects").then((r) => r.json());
          if (res.success) {
            setProjects(
              res.data.map((p: any) => ({
                id: String(p.id),
                name: p.name,
                budget: 50000,
                hourlyRate: 50,
                revenue: 75000,
                alertThresholds: [80, 90, 100],
              })),
            );
          }
        } else {
          const data = await fetch("/data/projects.json").then((r) => r.json());
          const list = Array.isArray(data) ? data : data?.projects || [];
          setProjects(
            list.map((p: any) => ({
              ...p,
              id: String(p.id),
              budget: p.budget ?? 50000,
              hourlyRate: p.hourlyRate ?? 50,
              revenue: p.revenue ?? 75000,
              alertThresholds: p.alertThresholds ?? [80, 90, 100],
            })),
          );
        }
      } catch (err) {
        console.error("Projects load failed", err);
      }

      // Expenses
      try {
        if (isMock) throw new Error("mock");
        const res = await fetch("/api/expenses").then((r) => r.json());
        if (res.success) {
          setExpenses(
            res.data.map((e: any) => ({
              id: String(e.id),
              projectId: String(e.projectId),
              date: e.date,
              vendor: e.vendor,
              amount: parseFloat(e.amount),
              note: e.note,
            })),
          );
        }
      } catch {
        if (isMock) {
          fetch("/data/expenses.json")
            .then((r) => r.json())
            .then(setExpenses)
            .catch(() => {});
        }
      }

      // Time Logs
      try {
        if (isMock) throw new Error("mock");
        const res = await fetch("/api/time-logs").then((r) => r.json());
        if (res.success) {
          setTimeLogs(
            res.data.map((l: any) => ({
              id: String(l.id),
              projectId: String(l.projectId),
              date: l.date,
              hours: parseFloat(l.hours),
            })),
          );
        }
      } catch {
        if (isMock) {
          fetch("/data/timelogs.json")
            .then((r) => r.json())
            .then(setTimeLogs)
            .catch(() => {});
        }
      }

      // Invoices
      try {
        if (isMock) throw new Error("mock");
        const res = await fetch("/api/invoices").then((r) => r.json());
        if (res.success) {
          setInvoices(
            res.data.map((inv: any) => ({
              id: String(inv.id),
              projectId: String(inv.projectId),
              clientName: inv.clientName || "Unknown",
              issueDate: inv.issueDate || inv.date,
              dueDate: inv.dueDate || "",
              status: inv.status || "Draft",
              items: inv.items || [],
              total: parseFloat(inv.total || inv.amount),
            })),
          );
        }
      } catch {
        if (isMock) {
          fetch("/data/invoices.json")
            .then((r) => r.json())
            .then(setInvoices)
            .catch(() => {});
        }
      }
    };
    load();
  }, []);

  // Totals Calculation
  const totals = useMemo(() => {
    const byProject: Record<
      string,
      {
        expenseTotal: number;
        timeCost: number;
        budget: number;
        revenue: number;
      }
    > = {};
    for (const p of projects) {
      byProject[p.id] = {
        expenseTotal: 0,
        timeCost: 0,
        budget: p.budget || 0,
        revenue: p.revenue || 0,
      };
    }
    for (const e of expenses) {
      if (byProject[e.projectId])
        byProject[e.projectId].expenseTotal += e.amount;
    }
    for (const t of timeLogs) {
      const proj = projects.find((p) => p.id === t.projectId);
      if (proj && byProject[t.projectId]) {
        byProject[t.projectId].timeCost += t.hours * (proj.hourlyRate || 0);
      }
    }
    return byProject;
  }, [projects, expenses, timeLogs]);

  // Budget Alerts
  useEffect(() => {
    for (const p of projects) {
      const t = totals[p.id];
      if (!t || !p.budget) continue;
      const actual = t.expenseTotal + t.timeCost;
      const pct = Math.round((actual / p.budget) * 100);
      const thresholds = p.alertThresholds || [80, 90, 100];
      const alerted = budgetAlerts[p.id] || [];
      for (const threshold of thresholds) {
        if (pct >= threshold && !alerted.includes(threshold)) {
          pushToast(
            `⚠️ ${p.name}: Budget ${threshold}% used`,
            threshold >= 100 ? "error" : "warning",
          );
          setBudgetAlerts((prev) => ({
            ...prev,
            [p.id]: [...alerted, threshold],
          }));
        }
      }
    }
  }, [totals, projects, budgetAlerts]);

  // Handlers
  const handleCreateInvoice = async () => {
    if (!newInvoice.projectId || !newInvoice.clientName) return;
    const proj = projects.find((p) => p.id === newInvoice.projectId);
    if (!proj) return;

    const projExpenses = expenses.filter(
      (e) => e.projectId === newInvoice.projectId,
    );
    const projTime = timeLogs.filter(
      (t) => t.projectId === newInvoice.projectId,
    );
    const timeCost = projTime.reduce(
      (sum, t) => sum + t.hours * (proj.hourlyRate || 0),
      0,
    );

    const items = [
      {
        description: `Time logged (${projTime.reduce((s, t) => s + t.hours, 0)} hrs @ ${currency(proj.hourlyRate || 0)}/hr)`,
        amount: timeCost,
      },
      ...projExpenses.map((e) => ({
        description: `${e.vendor} - ${e.note || "Expense"}`,
        amount: e.amount,
      })),
    ];
    const total = items.reduce((sum, i) => sum + i.amount, 0);

    const res = await createInvoiceAction({
      projectId: Number(newInvoice.projectId),
      clientName: newInvoice.clientName,
      issueDate: newInvoice.issueDate,
      dueDate: newInvoice.dueDate,
      status: "Draft",
      items,
      total,
    });

    if (res.success) {
      setInvoices((prev) => [
        {
          id: String(res.data.id),
          projectId: newInvoice.projectId,
          clientName: newInvoice.clientName,
          issueDate: newInvoice.issueDate,
          dueDate: newInvoice.dueDate,
          status: "Draft" as const,
          items,
          total,
        },
        ...prev,
      ]);
      setInvoiceModalOpen(false);
      pushToast(`Invoice created for ${newInvoice.clientName}`);
    } else {
      pushToast(res.error || "Failed to create invoice", "error");
    }
  };

  const handleExportPDF = (invoice: Invoice) => {
    const lines = [
      `INVOICE ${invoice.id}`,
      `Client: ${invoice.clientName}`,
      `Total: ${currency(invoice.total)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice_${invoice.id}.txt`;
    link.click();
    pushToast(`Invoice ${invoice.id} exported`);
  };

  return (
    <section className="py-4 md:p-8 space-y-6">
      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-md border shadow-lg flex items-center gap-2 ${t.type === "error" ? "bg-red-500/10 border-red-500 text-red-600" : t.type === "warning" ? "bg-yellow-500/10 border-yellow-500 text-yellow-600" : "bg-card border"}`}
            >
              {t.type === "error" && <AlertTriangle className="w-4 h-4" />}
              {t.type === "warning" && <Bell className="w-4 h-4" />}
              {t.type === "info" && <CheckCircle className="w-4 h-4" />}
              <span className="text-sm">{t.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-nowrap">
              Financial Tracking
            </h1>
            <p className="text-sm text-muted-foreground">
              Budget, Time Logs, Expenses, Profits
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingProject(projects[0] || null);
            setSettingsModalOpen(true);
          }}
        >
          <Settings className="w-4 h-4 mr-2" />
          Project Settings
        </Button>
      </div>

      <FinancialSummary
        projects={projects}
        totals={totals}
        currency={currency}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <FinancialForecast
          invoices={invoices}
          expenses={expenses}
          currency={currency}
        />
        <BudgetTracker
          projects={projects}
          totals={totals}
          currency={currency}
        />
      </div>

      <TimeLogTracker
        projects={projects}
        timeLogs={timeLogs}
        setTimeLogs={setTimeLogs}
        currency={currency}
        onExport={() => {}}
        onExportCSV={() => {}}
        onImport={() => {}}
        pushToast={pushToast}
      />

      <ExpenseTracker
        projects={projects}
        expenses={expenses}
        setExpenses={setExpenses}
        currency={currency}
        onExport={() => {}}
        onExportCSV={() => {}}
        onImport={() => {}}
        pushToast={pushToast}
      />

      <ProfitabilityAnalysis
        projects={projects}
        totals={totals}
        currency={currency}
      />

      <InvoiceTracker
        invoices={invoices}
        setInvoices={setInvoices}
        projects={projects}
        currency={currency}
        onNewInvoice={() => setInvoiceModalOpen(true)}
        onExportPDF={handleExportPDF}
      />

      <FinanceModals
        projects={projects}
        setProjects={setProjects}
        settingsOpen={settingsModalOpen}
        setSettingsOpen={setSettingsModalOpen}
        editingProject={editingProject}
        setEditingProject={setEditingProject}
        invoiceOpen={invoiceModalOpen}
        setInvoiceOpen={setInvoiceModalOpen}
        newInvoice={newInvoice}
        setNewInvoice={setNewInvoice}
        timeLogs={timeLogs}
        expenses={expenses}
        onCreateInvoice={handleCreateInvoice}
      />
    </section>
  );
}
