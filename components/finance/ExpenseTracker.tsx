"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { Receipt, Plus, Download, Upload } from "lucide-react";
import { addExpense as addExpenseAction } from "@/actions/finance";

type Project = { id: string; name: string };
type Expense = {
  id: string;
  projectId: string;
  date: string;
  vendor: string;
  amount: number;
  note?: string;
};

interface ExpenseTrackerProps {
  projects: Project[];
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  currency: (n: number) => string;
  onExport: () => void;
  onExportCSV: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pushToast: (msg: string, type?: "info" | "warning" | "error") => void;
}

export function ExpenseTracker({
  projects,
  expenses,
  setExpenses,
  currency,
  onExport,
  onExportCSV,
  onImport,
  pushToast,
}: ExpenseTrackerProps) {
  const [expenseFilter, setExpenseFilter] = useState({
    projectId: "",
    q: "",
    from: "",
    to: "",
  });

  const [newExpense, setNewExpense] = useState({
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
    amount: "",
    note: "",
  });

  const handleAddExpense = async () => {
    if (!newExpense.projectId || !newExpense.vendor || !newExpense.amount)
      return;

    const amount = parseFloat(newExpense.amount);
    const res = await addExpenseAction({
      projectId: Number(newExpense.projectId),
      amount,
      vendor: newExpense.vendor,
      date: new Date(newExpense.date),
      note: newExpense.note,
    });

    if (res.success) {
      setExpenses([
        {
          id: String(res.data.id),
          projectId: newExpense.projectId,
          date: newExpense.date,
          vendor: newExpense.vendor,
          amount,
          note: newExpense.note,
        },
        ...expenses,
      ]);
      setNewExpense({
        projectId: "",
        date: new Date().toISOString().slice(0, 10),
        vendor: "",
        amount: "",
        note: "",
      });
      pushToast("Expense added successfully", "info");
    } else {
      pushToast(res.error || "Failed to add expense", "error");
    }
  };

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

  return (
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onExportCSV}>
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
              onChange={onImport}
            />
          </div>
        }
      />

      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-5 gap-3">
          <select
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
            value={expenseFilter.projectId}
            onChange={(e) =>
              setExpenseFilter({ ...expenseFilter, projectId: e.target.value })
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
            placeholder="Description or vendor contains..."
            value={expenseFilter.q}
            onChange={(e) =>
              setExpenseFilter({ ...expenseFilter, q: e.target.value })
            }
          />
          <Input
            type="date"
            value={expenseFilter.from}
            onChange={(e) =>
              setExpenseFilter({ ...expenseFilter, from: e.target.value })
            }
          />
          <Input
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
          />
          <Input
            placeholder="Vendor"
            value={newExpense.vendor}
            onChange={(e) =>
              setNewExpense({ ...newExpense, vendor: e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense({ ...newExpense, amount: e.target.value })
            }
          />
          <Button onClick={handleAddExpense} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

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
                      {e.note && <span className="italic">• {e.note}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold">{currency(e.amount)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExpenses(expenses.filter((x) => x.id !== e.id));
                      pushToast("Expense deleted (local only)", "info");
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
    </Card>
  );
}
