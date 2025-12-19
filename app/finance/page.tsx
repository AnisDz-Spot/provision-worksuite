"use client";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/finance/MetricCard";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { Modal } from "@/components/ui/Modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DollarSign,
  Clock,
  Receipt,
  Calculator,
  Plus,
  Settings,
  Download,
  Upload,
  FileText,
  TrendingUp,
  Bell,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { log } from "@/lib/logger";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [newExpense, setNewExpense] = useState<{
    projectId: string;
    date: string;
    vendor: string;
    amount: string;
    note: string;
  }>({
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    amount: "",
    note: "",
  });
  const [newTimeLog, setNewTimeLog] = useState<{
    projectId: string;
    date: string;
    hours: string;
  }>({ projectId: "", date: new Date().toISOString().slice(0, 10), hours: "" });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<{
    projectId: string;
    clientName: string;
    issueDate: string;
    dueDate: string;
  }>({
    projectId: "",
    clientName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  });
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "info" | "warning" | "error" }>
  >([]);
  const [budgetAlerts, setBudgetAlerts] = useState<Record<string, number[]>>(
    {}
  );
  const [expenseFilter, setExpenseFilter] = useState<{
    projectId: string;
    q: string;
    from: string;
    to: string;
  }>({ projectId: "", q: "", from: "", to: "" });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [timeFilter, setTimeFilter] = useState<{
    projectId: string;
    from: string;
    to: string;
  }>({ projectId: "", from: "", to: "" });

  useEffect(() => {
    import("@/lib/dataSource").then(({ shouldUseDatabaseData }) => {
      if (shouldUseDatabaseData()) {
        fetch("/api/projects")
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data) {
              const list = res.data.map((p: any) => ({
                id: p.id,
                name: p.name,
                budget: 50000,
                hourlyRate: 50,
                revenue: 75000,
                alertThresholds: [80, 90, 100],
              }));
              setProjects(list);
            } else {
              setProjects([]);
            }
          })
          .catch((err) => console.error("Failed to load projects", err));
      } else {
        fetch("/data/projects.json")
          .then((r) => r.json())
          .then((data) => {
            const list: Project[] = Array.isArray(data)
              ? data
              : data?.projects || [];
            setProjects(
              list.map((p) => ({
                ...p,
                budget: p.budget ?? 50000,
                hourlyRate: p.hourlyRate ?? 50,
                revenue: p.revenue ?? 75000,
                alertThresholds: p.alertThresholds ?? [80, 90, 100],
              }))
            );
          })
          .catch((err) => log.error({ err }, "Failed to load projects"));
      }
    });

    // Expenses
    const fetchExpenses = async () => {
      try {
        const { shouldUseMockData } = await import("@/lib/dataSource");
        const isMock = shouldUseMockData();

        if (isMock) {
          throw new Error("Use mock data");
        }

        const r = await fetch("/api/expenses");
        const res = await r.json();

        if (res?.success && res.data) {
          const dbExpenses = res.data.map((e: any) => ({
            id: String(e.id),
            projectId: e.project_id || "",
            date: e.date,
            vendor: e.vendor,
            amount: parseFloat(e.amount),
            note: e.note,
          }));
          setExpenses(dbExpenses);
        } else {
          // If DB call succeeds but no data, or structure mismatch
          setExpenses([]);
        }
      } catch (error) {
        // Fallback to mock only if explicitly in mock mode or if requested
        import("@/lib/dataSource").then(({ shouldUseMockData }) => {
          if (shouldUseMockData()) {
            fetch("/data/expenses.json")
              .then((r) => r.json())
              .then(setExpenses)
              .catch(() => setExpenses([]));
          } else {
            setExpenses([]);
          }
        });
      }
    };
    fetchExpenses();

    // Time logs
    const fetchTimeLogs = async () => {
      try {
        const { shouldUseMockData } = await import("@/lib/dataSource");
        if (shouldUseMockData()) throw new Error("Use mock data");

        const r = await fetch("/api/time-logs");
        const res = await r.json();

        if (res?.success && res.data) {
          const dbLogs = res.data.map((log: any) => ({
            id: String(log.id),
            projectId: log.project_id || "",
            date: log.date,
            hours: parseFloat(log.hours),
          }));
          setTimeLogs(dbLogs);
        } else {
          setTimeLogs([]);
        }
      } catch (error) {
        import("@/lib/dataSource").then(({ shouldUseMockData }) => {
          if (shouldUseMockData()) {
            fetch("/data/timelogs.json")
              .then((r) => r.json())
              .then(setTimeLogs)
              .catch(() => setTimeLogs([]));
          } else {
            setTimeLogs([]);
          }
        });
      }
    };
    fetchTimeLogs();

    // Invoices
    const fetchInvoices = async () => {
      try {
        const { shouldUseMockData } = await import("@/lib/dataSource");
        if (shouldUseMockData()) throw new Error("Use mock data");

        const r = await fetch("/api/invoices");
        const res = await r.json();

        if (res?.success && res.data) {
          const dbInvoices = res.data.map((inv: any) => ({
            id: String(inv.id),
            projectId: inv.project_id || "",
            clientName: inv.client_name || "Unknown",
            issueDate: inv.date,
            dueDate: inv.due_date || "",
            status: inv.status || "Draft",
            items: [],
            total: parseFloat(inv.amount),
          }));
          setInvoices(dbInvoices);
        } else {
          setInvoices([]);
        }
      } catch (error) {
        import("@/lib/dataSource").then(({ shouldUseMockData }) => {
          if (shouldUseMockData()) {
            fetch("/data/invoices.json")
              .then((r) => r.json())
              .then(setInvoices)
              .catch(() => setInvoices([]));
          } else {
            setInvoices([]);
          }
        });
      }
    };
    fetchInvoices();
  }, []);

  // Initialize expense filters from URL or localStorage
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
        setExpenseFilter(fromUrl);
        return;
      }
      const raw = localStorage.getItem("pv:financeExpensesFilters");
      if (raw) setExpenseFilter(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist expense filters to localStorage and URL
  useEffect(() => {
    try {
      localStorage.setItem(
        "pv:financeExpensesFilters",
        JSON.stringify(expenseFilter)
      );
    } catch {}
    const params = new URLSearchParams(searchParams.toString());
    if (expenseFilter.projectId) params.set("project", expenseFilter.projectId);
    else params.delete("project");
    if (expenseFilter.q) params.set("q", expenseFilter.q);
    else params.delete("q");
    if (expenseFilter.from) params.set("from", expenseFilter.from);
    else params.delete("from");
    if (expenseFilter.to) params.set("to", expenseFilter.to);
    else params.delete("to");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [expenseFilter, pathname, router, searchParams]);

  // Initialize time log filters from URL or localStorage
  useEffect(() => {
    try {
      const fromUrl = {
        projectId: searchParams.get("tb_project") || "",
        from: searchParams.get("tb_from") || "",
        to: searchParams.get("tb_to") || "",
      };
      if (Object.values(fromUrl).some(Boolean)) {
        setTimeFilter(fromUrl);
        return;
      }
      const raw = localStorage.getItem("pv:financeTimeFilters");
      if (raw) setTimeFilter(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist time log filters to localStorage and URL
  useEffect(() => {
    try {
      localStorage.setItem("pv:financeTimeFilters", JSON.stringify(timeFilter));
    } catch {}
    const params = new URLSearchParams(searchParams.toString());
    if (timeFilter.projectId) params.set("tb_project", timeFilter.projectId);
    else params.delete("tb_project");
    if (timeFilter.from) params.set("tb_from", timeFilter.from);
    else params.delete("tb_from");
    if (timeFilter.to) params.set("tb_to", timeFilter.to);
    else params.delete("tb_to");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [timeFilter, pathname, router, searchParams]);

  const filteredTimeLogs = useMemo(() => {
    return timeLogs.filter((t) => {
      if (timeFilter.projectId && t.projectId !== timeFilter.projectId)
        return false;
      if (timeFilter.from && t.date < timeFilter.from) return false;
      if (timeFilter.to && t.date > timeFilter.to) return false;
      return true;
    });
  }, [timeLogs, timeFilter]);

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
      if (!byProject[e.projectId]) continue;
      byProject[e.projectId].expenseTotal += e.amount;
    }
    for (const t of timeLogs) {
      const proj = projects.find((p) => p.id === t.projectId);
      if (!proj) continue;
      byProject[t.projectId].timeCost += t.hours * (proj.hourlyRate || 0);
    }
    return byProject;
  }, [projects, expenses, timeLogs]);

  const pushToast = (
    message: string,
    type: "info" | "warning" | "error" = "info"
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  // Budget alert monitoring
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
            `⚠️ ${p.name}: Budget ${threshold}% used (${currency(actual)} / ${currency(p.budget)})`,
            threshold >= 100 ? "error" : "warning"
          );
          setBudgetAlerts({ ...budgetAlerts, [p.id]: [...alerted, threshold] });
        }
      }
    }
  }, [totals, projects]);

  const currency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  const exportExpenses = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExpensesCSV = () => {
    const header = ["date", "project", "vendor", "amount", "note"];
    const filtered = expenses.filter((e) => {
      if (expenseFilter.projectId && e.projectId !== expenseFilter.projectId)
        return false;
      if (expenseFilter.q) {
        const q = expenseFilter.q.toLowerCase();
        const inVendor = (e.vendor || "").toLowerCase().includes(q);
        const inNote = (e.note || "").toLowerCase().includes(q);
        if (!inVendor && !inNote) return false;
      }
      if (expenseFilter.from && e.date < expenseFilter.from) return false;
      if (expenseFilter.to && e.date > expenseFilter.to) return false;
      return true;
    });
    const rows = filtered.map((e) => [
      e.date,
      projects.find((p) => p.id === e.projectId)?.name || e.projectId,
      e.vendor,
      e.amount,
      e.note || "",
    ]);
    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) =>
            typeof v === "string" && v.includes(",")
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

  const importExpenses = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) setExpenses(data);
      } catch (err) {
        log.error({ err }, "Invalid JSON for expenses import");
      }
    };
    reader.readAsText(file);
  };

  const exportTimeLogs = () => {
    const dataStr = JSON.stringify(filteredTimeLogs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timelogs_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportTimeLogsCSV = () => {
    const header = ["date", "project", "hours"];
    const rows = filteredTimeLogs.map((t) => [
      t.date,
      projects.find((p) => p.id === t.projectId)?.name || t.projectId,
      t.hours,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timelogs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTimeLogs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) setTimeLogs(data);
      } catch (err) {
        log.error({ err }, "Invalid JSON for time logs import");
      }
    };
    reader.readAsText(file);
  };

  const createInvoice = () => {
    if (!newInvoice.projectId || !newInvoice.clientName) return;
    const proj = projects.find((p) => p.id === newInvoice.projectId);
    if (!proj) return;
    const projExpenses = expenses.filter(
      (e) => e.projectId === newInvoice.projectId
    );
    const projTime = timeLogs.filter(
      (t) => t.projectId === newInvoice.projectId
    );
    const timeCost = projTime.reduce(
      (sum, t) => sum + t.hours * (proj.hourlyRate || 0),
      0
    );
    const expenseCost = projExpenses.reduce((sum, e) => sum + e.amount, 0);
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
    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      projectId: newInvoice.projectId,
      clientName: newInvoice.clientName,
      issueDate: newInvoice.issueDate,
      dueDate: newInvoice.dueDate,
      status: "Draft",
      items,
      total,
    };
    setInvoices([invoice, ...invoices]);
    setInvoiceModalOpen(false);
    pushToast(
      `Invoice ${invoice.id} created for ${newInvoice.clientName}`,
      "info"
    );
  };

  const exportInvoicePDF = (invoice: Invoice) => {
    const proj = projects.find((p) => p.id === invoice.projectId);
    const lines = [
      `INVOICE ${invoice.id}`,
      ``,
      `Client: ${invoice.clientName}`,
      `Project: ${proj?.name || invoice.projectId}`,
      `Issue Date: ${invoice.issueDate}`,
      `Due Date: ${invoice.dueDate}`,
      `Status: ${invoice.status}`,
      ``,
      `ITEMS:`,
      ...invoice.items.map((i) => `  ${i.description}: ${currency(i.amount)}`),
      ``,
      `TOTAL: ${currency(invoice.total)}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice_${invoice.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    pushToast(`Invoice ${invoice.id} exported`, "info");
  };

  return (
    <section className="py-4 md:p-8 space-y-6">
      {/* Toast notifications */}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Financial Tracking</h1>
            <p className="text-sm text-muted-foreground">
              Budget vs Actual, Time Billing, Expenses, Profitability
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

      {/* Financial Reports Dashboard */}
      <Card className="p-4">
        <SectionHeader
          icon={<TrendingUp className="w-4 h-4" />}
          title="Financial Reports"
        />
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <MetricCard
            title="Total Revenue"
            value={currency(projects.reduce((s, p) => s + (p.revenue || 0), 0))}
          />
          <MetricCard
            title="Total Costs"
            value={currency(
              Object.values(totals).reduce(
                (s, t) => s + t.expenseTotal + t.timeCost,
                0
              )
            )}
          />
          <MetricCard
            title="Net Profit"
            value={currency(
              projects.reduce((s, p) => s + (p.revenue || 0), 0) -
                Object.values(totals).reduce(
                  (s, t) => s + t.expenseTotal + t.timeCost,
                  0
                )
            )}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-3">
            <div className="font-medium mb-2">Cost Breakdown</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Time Costs</span>
                <span className="font-medium">
                  {currency(
                    Object.values(totals).reduce((s, t) => s + t.timeCost, 0)
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Expenses</span>
                <span className="font-medium">
                  {currency(
                    Object.values(totals).reduce(
                      (s, t) => s + t.expenseTotal,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="font-medium mb-2">Budget Health</div>
            <div className="space-y-2">
              {projects.map((p) => {
                const t = totals[p.id] || {
                  expenseTotal: 0,
                  timeCost: 0,
                  budget: 0,
                  revenue: 0,
                };
                const actual = t.expenseTotal + t.timeCost;
                const pct = p.budget
                  ? Math.round((actual / p.budget) * 100)
                  : 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{p.name}</span>
                    <Badge
                      variant={
                        pct >= 100
                          ? "warning"
                          : pct >= 90
                            ? "secondary"
                            : "default"
                      }
                    >
                      {pct}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Card>

      {/* Cash Flow Forecast */}
      <Card className="p-6">
        <SectionHeader
          icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
          title="Cash Flow Forecast"
          subtitle="Next 90 days projected cash position"
        />
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            title="Expected Inflows"
            value={currency(
              invoices
                .filter(
                  (inv) =>
                    inv.status !== "Paid" &&
                    new Date(inv.dueDate) <=
                      new Date(Date.now() + 90 * 86400000)
                )
                .reduce((s, inv) => s + inv.total, 0)
            )}
          />
          <MetricCard
            title="Projected Expenses"
            value={currency(
              expenses
                .filter(
                  (e) =>
                    new Date(e.date) >= new Date(Date.now() - 30 * 86400000)
                )
                .reduce((s, e) => s + e.amount, 0) * 3
            )}
          />
          <MetricCard
            title="Net Position"
            value={currency(
              invoices
                .filter(
                  (inv) =>
                    inv.status !== "Paid" &&
                    new Date(inv.dueDate) <=
                      new Date(Date.now() + 90 * 86400000)
                )
                .reduce((s, inv) => s + inv.total, 0) -
                expenses
                  .filter(
                    (e) =>
                      new Date(e.date) >= new Date(Date.now() - 30 * 86400000)
                  )
                  .reduce((s, e) => s + e.amount, 0) *
                  3
            )}
          />
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Upcoming Receivables</h3>
          {invoices
            .filter(
              (inv) =>
                inv.status !== "Paid" &&
                new Date(inv.dueDate) <= new Date(Date.now() + 90 * 86400000)
            )
            .sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            )
            .slice(0, 5)
            .map((inv) => {
              const daysUntil = Math.ceil(
                (new Date(inv.dueDate).getTime() - Date.now()) / 86400000
              );
              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-accent/10 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{inv.clientName}</div>
                    <div className="text-xs text-muted-foreground">
                      Due {new Date(inv.dueDate).toLocaleDateString()} (
                      {daysUntil > 0 ? `${daysUntil} days` : "overdue"})
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{currency(inv.total)}</div>
                    <Badge
                      variant={daysUntil < 0 ? "warning" : "default"}
                      className="text-xs"
                    >
                      {inv.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          {invoices.filter(
            (inv) =>
              inv.status !== "Paid" &&
              new Date(inv.dueDate) <= new Date(Date.now() + 90 * 86400000)
          ).length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-4">
              No upcoming receivables
            </div>
          )}
        </div>
      </Card>

      {/* Profit Margins by Project */}
      <Card className="p-6">
        <SectionHeader
          icon={<Calculator className="w-4 h-4 text-green-600" />}
          title="Profit Margins by Project"
          subtitle="Compare profitability across projects"
        />
        <div className="space-y-4">
          {projects
            .map((p) => {
              const t = totals[p.id] || {
                expenseTotal: 0,
                timeCost: 0,
                budget: 0,
                revenue: 0,
              };
              const costs = t.expenseTotal + t.timeCost;
              const revenue = p.revenue || 0;
              const profit = revenue - costs;
              const margin =
                revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
              return { ...p, costs, revenue, profit, margin };
            })
            .sort((a, b) => b.margin - a.margin)
            .map((p) => (
              <Card
                key={p.id}
                className="p-4 border-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Revenue: {currency(p.revenue)} • Costs:{" "}
                      {currency(p.costs)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${p.margin >= 30 ? "text-green-600" : p.margin >= 15 ? "text-blue-600" : p.margin >= 0 ? "text-amber-600" : "text-red-600"}`}
                    >
                      {p.margin}%
                    </div>
                    <div className="text-xs text-muted-foreground">margin</div>
                  </div>
                </div>
                <ProgressBar
                  percent={Math.min(100, Math.max(0, p.margin))}
                  color={
                    p.margin >= 30
                      ? "success"
                      : p.margin >= 0
                        ? "warning"
                        : "danger"
                  }
                />
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm font-medium">Net Profit</span>
                  <span
                    className={`font-bold ${p.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {currency(p.profit)}
                  </span>
                </div>
              </Card>
            ))}
          {projects.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No projects yet. Add projects to see profitability analysis.
            </div>
          )}
        </div>
      </Card>

      {/* Invoice Management */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <h2 className="text-lg font-semibold">Invoices</h2>
          </div>
          <Button onClick={() => setInvoiceModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
        <div className="space-y-2">
          {invoices.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No invoices yet. Create your first invoice!
            </div>
          )}
          {invoices.map((inv) => {
            const proj = projects.find((p) => p.id === inv.projectId);
            const isOverdue =
              inv.status !== "Paid" && new Date(inv.dueDate) < new Date();
            return (
              <Card
                key={inv.id}
                className="p-3 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      inv.status === "Paid"
                        ? "default"
                        : isOverdue
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {inv.status}
                  </Badge>
                  <span className="font-medium">{inv.id}</span>
                  <span className="text-muted-foreground">
                    {inv.clientName}
                  </span>
                  <span className="text-xs">{proj?.name || inv.projectId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{currency(inv.total)}</span>
                  <span className="text-xs text-muted-foreground">
                    Due: {inv.dueDate}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportInvoicePDF(inv)}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                  <select
                    value={inv.status}
                    onChange={(e) =>
                      setInvoices(
                        invoices.map((i) =>
                          i.id === inv.id
                            ? {
                                ...i,
                                status: e.target.value as Invoice["status"],
                              }
                            : i
                        )
                      )
                    }
                    className="px-2 py-1 border rounded text-xs"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Budget vs Actual Spend */}
      <Card className="p-6">
        <SectionHeader
          icon={
            <div className="p-3 rounded-lg bg-purple-500/10">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          }
          title="Budget vs Actual Spend"
          subtitle="Track project spending against allocated budgets"
        />
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p) => {
            const t = totals[p.id] || {
              expenseTotal: 0,
              timeCost: 0,
              budget: 0,
              revenue: 0,
            };
            const actual = t.expenseTotal + t.timeCost;
            const remaining = (p.budget || 0) - actual;
            const pct = p.budget
              ? Math.min(100, Math.round((actual / (p.budget || 1)) * 100))
              : 0;
            const status =
              pct >= 100 ? "Over Budget" : pct >= 90 ? "Warning" : "Healthy";
            const statusColor =
              pct >= 100
                ? "text-red-600"
                : pct >= 90
                  ? "text-amber-600"
                  : "text-green-600";
            return (
              <Card
                key={p.id}
                className="p-5 border-2 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-1">{p.name}</div>
                    <Badge
                      variant={
                        pct >= 100
                          ? "warning"
                          : pct >= 90
                            ? "secondary"
                            : "default"
                      }
                      className="text-xs"
                    >
                      {status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${statusColor}`}>
                      {pct}%
                    </div>
                    <div className="text-xs text-muted-foreground">used</div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-semibold">
                      {currency(p.budget || 0)}
                    </span>
                  </div>
                  <ProgressBar
                    percent={pct}
                    color={
                      pct >= 100 ? "danger" : pct >= 90 ? "warning" : "success"
                    }
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-semibold">{currency(actual)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-muted-foreground">Time Cost</span>
                    </div>
                    <span className="font-medium">{currency(t.timeCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3 h-3 text-orange-600" />
                      <span className="text-muted-foreground">Expenses</span>
                    </div>
                    <span className="font-medium">
                      {currency(t.expenseTotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Remaining</span>
                    <span
                      className={`font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {remaining >= 0
                        ? currency(remaining)
                        : `(${currency(Math.abs(remaining))})`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Time-based Billing */}
      <Card className="p-6">
        <SectionHeader
          icon={
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          }
          title="Time-based Billing"
          subtitle="Track billable hours and calculate labor costs"
          right={
            <>
              <Button variant="outline" size="sm" onClick={exportTimeLogs}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={exportTimeLogsCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById("import-timelogs")?.click()
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                id="import-timelogs"
                type="file"
                accept=".json"
                className="hidden"
                onChange={importTimeLogs}
              />
            </>
          }
        />

        <Card className="p-4 mb-6">
          <div className="grid md:grid-cols-4 gap-3">
            <select
              aria-label="Filter by project"
              className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
              value={timeFilter.projectId}
              onChange={(e) =>
                setTimeFilter({ ...timeFilter, projectId: e.target.value })
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
              aria-label="From date"
              type="date"
              value={timeFilter.from}
              onChange={(e) =>
                setTimeFilter({ ...timeFilter, from: e.target.value })
              }
            />
            <Input
              aria-label="To date"
              type="date"
              value={timeFilter.to}
              onChange={(e) =>
                setTimeFilter({ ...timeFilter, to: e.target.value })
              }
            />
            <Button
              variant="outline"
              onClick={() => setTimeFilter({ projectId: "", from: "", to: "" })}
            >
              Reset
            </Button>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5 bg-linear-to-br from-blue-500/5 to-purple-500/5 border-2">
            <div className="font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Hours
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <select
                className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
                value={newTimeLog.projectId}
                onChange={(e) =>
                  setNewTimeLog({ ...newTimeLog, projectId: e.target.value })
                }
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                value={newTimeLog.date}
                onChange={(e) =>
                  setNewTimeLog({ ...newTimeLog, date: e.target.value })
                }
                className="border-border"
              />
              <Input
                type="number"
                placeholder="Hours"
                value={newTimeLog.hours}
                onChange={(e) =>
                  setNewTimeLog({ ...newTimeLog, hours: e.target.value })
                }
                className="border-border"
              />
              <Button
                onClick={() => {
                  if (!newTimeLog.projectId || !newTimeLog.hours) return;
                  setTimeLogs([
                    {
                      id: `tl-${Date.now()}`,
                      projectId: newTimeLog.projectId,
                      date: newTimeLog.date,
                      hours: parseFloat(newTimeLog.hours),
                    },
                    ...timeLogs,
                  ]);
                  setNewTimeLog({
                    projectId: "",
                    date: newTimeLog.date,
                    hours: "",
                  });
                  pushToast("Time log added successfully", "info");
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </Card>

          <Card className="p-5 border-2">
            <div className="font-semibold mb-4">
              Cost Summary{" "}
              {timeFilter.projectId || timeFilter.from || timeFilter.to
                ? "(filtered)"
                : ""}
            </div>
            <div className="space-y-3">
              {projects.map((p) => {
                const t = totals[p.id] || {
                  expenseTotal: 0,
                  timeCost: 0,
                  budget: 0,
                  revenue: 0,
                };
                const hours = filteredTimeLogs
                  .filter((tl) => tl.projectId === p.id)
                  .reduce((s, tl) => s + tl.hours, 0);
                const cost = hours * (p.hourlyRate || 0);
                return (
                  <div key={p.id} className="pb-3 border-b last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{p.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {hours.toFixed(2)}h
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        @ {currency(p.hourlyRate || 0)}/hr
                      </span>
                      <span className="font-semibold">{currency(cost)}</span>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">
                    {currency(
                      filteredTimeLogs.reduce((sum, t) => {
                        const proj = projects.find((p) => p.id === t.projectId);
                        return sum + t.hours * (proj?.hourlyRate || 0);
                      }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Expense Tracking */}
      <Card className="p-6">
        <SectionHeader
          icon={
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Receipt className="w-5 h-5 text-orange-600" />
            </div>
          }
          title="Expense Tracking"
          subtitle="Manage receipts, invoices, and project expenses"
          right={
            <>
              <Button variant="outline" size="sm" onClick={exportExpenses}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={exportExpensesCSV}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  document.getElementById("import-expenses")?.click()
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                id="import-expenses"
                type="file"
                accept=".json"
                className="hidden"
                onChange={importExpenses}
              />
            </>
          }
        />

        {/* Expense Filters */}
        <Card className="p-4 mb-6">
          <div className="grid md:grid-cols-5 gap-3">
            <select
              aria-label="Filter by project"
              className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
              value={expenseFilter.projectId}
              onChange={(e) =>
                setExpenseFilter({
                  ...expenseFilter,
                  projectId: e.target.value,
                })
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
              aria-label="Description/vendor contains"
              placeholder="Description or vendor contains..."
              value={expenseFilter.q}
              onChange={(e) =>
                setExpenseFilter({ ...expenseFilter, q: e.target.value })
              }
            />
            <Input
              aria-label="From date"
              type="date"
              value={expenseFilter.from}
              onChange={(e) =>
                setExpenseFilter({ ...expenseFilter, from: e.target.value })
              }
            />
            <Input
              aria-label="To date"
              type="date"
              value={expenseFilter.to}
              onChange={(e) =>
                setExpenseFilter({ ...expenseFilter, to: e.target.value })
              }
            />
            <Button
              variant="outline"
              onClick={() =>
                setExpenseFilter({ projectId: "", q: "", from: "", to: "" })
              }
            >
              Reset
            </Button>
          </div>
        </Card>

        <Card className="p-5 mb-6 bg-linear-to-br from-orange-500/5 to-red-500/5 border-2">
          <div className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add New Expense
          </div>
          <div className="grid md:grid-cols-5 gap-3">
            <select
              className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
              value={newExpense.projectId}
              onChange={(e) =>
                setNewExpense({ ...newExpense, projectId: e.target.value })
              }
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={newExpense.date}
              onChange={(e) =>
                setNewExpense({ ...newExpense, date: e.target.value })
              }
              className="border-border"
            />
            <Input
              placeholder="Vendor"
              value={newExpense.vendor}
              onChange={(e) =>
                setNewExpense({ ...newExpense, vendor: e.target.value })
              }
              className="border-border"
            />
            <Input
              type="number"
              placeholder="Amount"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense({ ...newExpense, amount: e.target.value })
              }
              className="border-border"
            />
            <Button
              onClick={() => {
                if (
                  !newExpense.projectId ||
                  !newExpense.vendor ||
                  !newExpense.amount
                )
                  return;
                setExpenses([
                  {
                    id: `exp-${Date.now()}`,
                    projectId: newExpense.projectId,
                    date: newExpense.date,
                    vendor: newExpense.vendor,
                    amount: parseFloat(newExpense.amount),
                    note: newExpense.note,
                  },
                  ...expenses,
                ]);
                setNewExpense({
                  projectId: "",
                  date: newExpense.date,
                  vendor: "",
                  amount: "",
                  note: "",
                });
                pushToast("Expense added successfully", "info");
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </Card>

        {(() => {
          const filtered = expenses.filter((e) => {
            if (
              expenseFilter.projectId &&
              e.projectId !== expenseFilter.projectId
            )
              return false;
            if (expenseFilter.q) {
              const q = expenseFilter.q.toLowerCase();
              const inVendor = (e.vendor || "").toLowerCase().includes(q);
              const inNote = (e.note || "").toLowerCase().includes(q);
              if (!inVendor && !inNote) return false;
            }
            if (expenseFilter.from && e.date < expenseFilter.from) return false;
            if (expenseFilter.to && e.date > expenseFilter.to) return false;
            return true;
          });
          return (
            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No expenses recorded yet</p>
                </div>
              )}
              {filtered.map((e) => {
                const proj = projects.find((p) => p.id === e.projectId);
                return (
                  <Card
                    key={e.id}
                    className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-orange-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <Receipt className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold">{e.vendor}</span>
                            <Badge variant="secondary" className="text-xs">
                              {proj?.name || e.projectId}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{e.date}</span>
                            {e.note && (
                              <span className="italic">• {e.note}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xl font-bold">
                            {currency(e.amount)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExpenses(expenses.filter((x) => x.id !== e.id));
                            pushToast("Expense deleted", "info");
                          }}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()}
      </Card>

      {/* Profitability Calculator */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Calculator className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Profitability Analysis</h2>
            <p className="text-xs text-muted-foreground">
              Revenue vs costs with detailed profit margins
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((p) => {
            const t = totals[p.id] || {
              expenseTotal: 0,
              timeCost: 0,
              budget: 0,
              revenue: 0,
            };
            const costs = t.expenseTotal + t.timeCost;
            const profit = (p.revenue || 0) - costs;
            const profitable = profit >= 0;
            const margin = p.revenue
              ? Math.round((profit / p.revenue) * 100)
              : 0;
            return (
              <Card
                key={p.id}
                className={`p-5 border-2 ${profitable ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg mb-1">{p.name}</div>
                    <Badge
                      variant={profitable ? "default" : "warning"}
                      className="text-xs"
                    >
                      {profitable ? `${margin}% Margin` : "Loss"}
                    </Badge>
                  </div>
                  <div
                    className={`text-right ${profitable ? "text-green-600" : "text-red-600"}`}
                  >
                    <div className="text-2xl font-bold">
                      {profitable ? "+" : ""}
                      {currency(profit)}
                    </div>
                    <div className="text-xs font-medium">
                      {profitable ? "Profit" : "Loss"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Revenue
                      </div>
                      <div className="font-semibold">
                        {currency(p.revenue || 0)}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Time
                        </div>
                        <div className="font-medium text-sm">
                          {currency(t.timeCost)}
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Expenses
                        </div>
                        <div className="font-medium text-sm">
                          {currency(t.expenseTotal)}
                        </div>
                      </div>
                      <Receipt className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border-2 font-semibold">
                    <span>Total Costs</span>
                    <span>{currency(costs)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Overall Summary */}
        <Card className="mt-6 p-5 bg-linear-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Total Portfolio Profit
              </div>
              <div className="text-3xl font-bold text-green-600">
                {currency(
                  projects.reduce((s, p) => {
                    const t = totals[p.id] || {
                      expenseTotal: 0,
                      timeCost: 0,
                      budget: 0,
                      revenue: 0,
                    };
                    return (
                      s + ((p.revenue || 0) - (t.expenseTotal + t.timeCost))
                    );
                  }, 0)
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">
                Overall Margin
              </div>
              <div className="text-2xl font-bold">
                {projects.reduce((s, p) => s + (p.revenue || 0), 0) > 0
                  ? Math.round(
                      (projects.reduce((s, p) => {
                        const t = totals[p.id] || {
                          expenseTotal: 0,
                          timeCost: 0,
                          budget: 0,
                          revenue: 0,
                        };
                        return (
                          s + ((p.revenue || 0) - (t.expenseTotal + t.timeCost))
                        );
                      }, 0) /
                        projects.reduce((s, p) => s + (p.revenue || 0), 0)) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </Card>
      </Card>

      {/* Project Settings Modal */}
      <Modal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        size="md"
      >
        <h2 className="text-xl font-semibold mb-4">
          Project Financial Settings
        </h2>
        {editingProject && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                value={editingProject.id}
                onChange={(e) =>
                  setEditingProject(
                    projects.find((p) => p.id === e.target.value) || null
                  )
                }
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-full"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Budget ($)
              </label>
              <Input
                type="number"
                value={editingProject.budget || 0}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    budget: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Hourly Rate ($)
              </label>
              <Input
                type="number"
                value={editingProject.hourlyRate || 0}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    hourlyRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Revenue ($)
              </label>
              <Input
                type="number"
                value={editingProject.revenue || 0}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    revenue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Budget Alert Thresholds (%)
              </label>
              <div className="flex gap-2">
                {(editingProject.alertThresholds || [80, 90, 100]).map(
                  (val, idx) => (
                    <Input
                      key={idx}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newThresholds = [
                          ...(editingProject.alertThresholds || [80, 90, 100]),
                        ];
                        newThresholds[idx] = parseFloat(e.target.value) || 0;
                        setEditingProject({
                          ...editingProject,
                          alertThresholds: newThresholds,
                        });
                      }}
                      className="w-20"
                    />
                  )
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Alerts will fire when budget reaches these percentages.
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setSettingsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editingProject) return;
                  setProjects(
                    projects.map((p) =>
                      p.id === editingProject.id ? editingProject : p
                    )
                  );
                  setSettingsModalOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Creation Modal */}
      <Modal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        size="md"
      >
        <h2 className="text-xl font-semibold mb-4">Create Invoice</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project</label>
            <select
              value={newInvoice.projectId}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, projectId: e.target.value })
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-full"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Client Name
            </label>
            <Input
              value={newInvoice.clientName}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, clientName: e.target.value })
              }
              placeholder="Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Issue Date
              </label>
              <Input
                type="date"
                value={newInvoice.issueDate}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, issueDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          {newInvoice.projectId && (
            <Card className="p-3 bg-accent/10">
              <div className="text-xs font-medium mb-2">Preview</div>
              <div className="text-sm space-y-1">
                <div>
                  Time Logs:{" "}
                  {timeLogs
                    .filter((t) => t.projectId === newInvoice.projectId)
                    .reduce((s, t) => s + t.hours, 0)}{" "}
                  hrs
                </div>
                <div>
                  Expenses:{" "}
                  {
                    expenses.filter((e) => e.projectId === newInvoice.projectId)
                      .length
                  }{" "}
                  items
                </div>
              </div>
            </Card>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setInvoiceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={createInvoice}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
