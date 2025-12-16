"use client";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  ChangeEvent,
} from "react";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { MetricCard } from "@/components/finance/MetricCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { log } from "@/lib/logger";

// Types
type Project = { id: string; name: string };
type Expense = {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  date: string;
};

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ExpensesPage() {
  // State Definitions
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // State for the "Add Expense" modal
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    projectId: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [filters, setFilters] = useState<{
    projectId: string;
    q: string;
    from: string;
    to: string;
  }>({ projectId: "", q: "", from: "", to: "" });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handler Functions
  const handleAddExpense = useCallback(async () => {
    setAddError(null);
    if (
      !newExpense.projectId ||
      !newExpense.description ||
      !newExpense.amount
    ) {
      setAddError("All fields are required.");
      return;
    }
    setAddLoading(true);

    const expenseObj: Expense = {
      id: `exp_${Date.now()}`,
      projectId: newExpense.projectId,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
    };

    const resetState = () => {
      setAddOpen(false);
      setNewExpense({
        projectId: "",
        description: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
      });
      setAddLoading(false);
    };

    try {
      // Try API first
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseObj),
      });
      const data = await res.json();
      if (data?.success) {
        setExpenses((prev) => [data.data, ...prev]);
        resetState();
        return;
      }
      throw new Error("API not configured, falling back.");
    } catch (e) {
      log.warn({ err: e }, "API POST failed, falling back to local state");
      // Fallback to local state
      setExpenses((prev) => [expenseObj, ...prev]);
      resetState();
    }
  }, [newExpense]);

  // Data Loading Effect
  useEffect(() => {
    const load = async () => {
      const pData = await fetch(`/data/projects.json`).then((r) => r.json());
      setProjects(pData);

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
  }, [searchParams]);

  // Persist filters to localStorage and URL (Fix for re-render loop remains)
  useEffect(() => {
    try {
      localStorage.setItem("pv:expensesFilters", JSON.stringify(filters));
    } catch {}

    const params = new URLSearchParams();
    if (filters.projectId) params.set("project", filters.projectId);
    if (filters.q) params.set("q", filters.q);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const newQs = params.toString();
    const currentQs = searchParams.toString();

    // Only update the router if the query string has actually changed
    if (newQs !== currentQs) {
      router.replace(newQs ? `${pathname}?${newQs}` : `${pathname}`, {
        scroll: false,
      });
    }
  }, [filters, pathname, router, searchParams]);

  // Data Memoization
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
        const inDesc = e.description?.toLowerCase().includes(q);
        if (!inDesc) return false;
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

  // Download Handlers
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
      e.description || "",
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

  // Import Handler
  const onImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || "[]"));
        setExpenses(Array.isArray(data) ? data : []);
      } catch (error) {
        log.error({ err: error }, "Error importing file");
      }
    };
    reader.readAsText(file);
  };

  // Component Render
  return (
    <div className="space-y-6 relative">
      {/* 🛑 The floating Add Expense Button has been removed from here. */}

      {/* Add Expense Modal */}
      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        size="sm"
        className="md:min-w-[40vw]"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Add Expense</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Project</label>
            <select
              className="w-full rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm"
              value={newExpense.projectId}
              onChange={(e) =>
                setNewExpense((v) => ({ ...v, projectId: e.target.value }))
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
            <label className="block text-sm font-medium">Description</label>
            <Input
              value={newExpense.description}
              onChange={(e) =>
                setNewExpense((v) => ({ ...v, description: e.target.value }))
              }
              placeholder="Expense description"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Amount</label>
            <Input
              type="number"
              min="0"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense((v) => ({ ...v, amount: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Date</label>
            <Input
              type="date"
              value={newExpense.date}
              onChange={(e) =>
                setNewExpense((v) => ({ ...v, date: e.target.value }))
              }
            />
          </div>
          {addError && (
            <div className="text-destructive text-sm">{addError}</div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleAddExpense}
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

      <SectionHeader
        title="Expenses"
        right={
          // 🟢 Added the "Add Expense" button here
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAddOpen(true)}>
              + Add Expense
            </Button>
            <Button size="sm" onClick={download}>
              Export (JSON)
            </Button>
            <Button size="sm" variant="outline" onClick={downloadCSV}>
              Export (CSV)
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
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <MetricCard
            key={p.id}
            title={p.name}
            value={formatCurrency(
              Number(byProjectFiltered[p.id] ?? byProject[p.id] ?? 0)
            )}
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
                <td className="p-3 align-top">{e.description}</td>
                <td className="p-3 align-top text-right">
                  {formatCurrency(e.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
