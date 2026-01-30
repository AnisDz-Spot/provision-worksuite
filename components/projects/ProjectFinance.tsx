"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToaster } from "@/components/ui/Toaster";
import { useLoading } from "@/context/LoadingContext";
import {
  addExpense,
  createInvoice,
  updateProjectBudget,
} from "@/actions/finance";
import {
  DollarSign,
  Receipt,
  FileText,
  PieChart,
  Plus,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
} from "lucide-react";

interface ProjectFinanceProps {
  projectId: string | number;
  projectUid?: string;
  projectName: string;
  budget?: number;
  spent?: number;
  onUpdate?: () => void;
  initialExpenses?: any[];
  initialInvoices?: any[];
}

export function ProjectFinance({
  projectId,
  projectUid,
  projectName,
  budget = 0,
  spent = 0,
  onUpdate,
  initialExpenses = [],
  initialInvoices = [],
}: ProjectFinanceProps) {
  const { show } = useToaster();
  const { showLoader, hideLoader } = useLoading();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      show("success", "Payment successful! Invoice updated.");
      // Optional: Clear param
      router.replace(`/projects/${projectId}?tab=invoices`);
      onUpdate?.(); // Refresh data
    } else if (searchParams.get("payment") === "cancelled") {
      show("error", "Payment cancelled.");
      router.replace(`/projects/${projectId}?tab=invoices`);
    }
  }, [searchParams, projectId, show, router, onUpdate]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "invoices" | "budget"
  >("overview");
  const [expenses, setExpenses] = useState<any[]>(initialExpenses);
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);

  // Expense State
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    vendor: "",
  });

  // Budget State
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [newBudget, setNewBudget] = useState(String(budget));

  // Invoice State
  const [addInvoiceOpen, setAddInvoiceOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    clientName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    items: [{ description: "Project Services", quantity: 1, rate: 0 }],
    status: "draft",
    notes: "",
  });

  useEffect(() => {
    // Only fetch if initial data is missing (client-side navigation/updates)
    // If initialExpenses is provided (SSR), we assume it's fresh enough for initial render.

    // Fetch Expenses
    const fetchExpenses = async () => {
      try {
        const res = await fetch(`/api/expenses?projectId=${projectId}`).then(
          (r) => r.json(),
        );
        if (res.success) {
          const all = res.data || [];
          setExpenses(
            all.filter(
              (e: any) =>
                String(e.projectId) === String(projectId) ||
                e.project?.uid === projectUid,
            ),
          );
        }
      } catch (e) {
        console.error("Failed to load expenses", e);
      }
    };

    // Fetch Invoices
    const fetchInvoices = async () => {
      try {
        const res = await fetch(`/api/invoices?projectId=${projectId}`).then(
          (r) => r.json(),
        );
        if (res.success) {
          const all = res.data || [];
          setInvoices(
            all.filter(
              (i: any) =>
                String(i.projectId) === String(projectId) ||
                i.project?.uid === projectUid,
            ),
          );
        }
      } catch (e) {
        console.error("Failed to load invoices", e);
      }
    };

    if (
      (activeTab === "expenses" || activeTab === "overview") &&
      initialExpenses.length === 0
    )
      fetchExpenses();
    if (
      (activeTab === "invoices" || activeTab === "overview") &&
      initialInvoices.length === 0
    )
      fetchInvoices();
  }, [
    projectId,
    projectUid,
    activeTab,
    initialExpenses.length,
    initialInvoices.length,
  ]);

  const handleCreateInvoice = async () => {
    if (!newInvoice.clientName || newInvoice.items.length === 0) return;
    showLoader("Creating invoice...");
    try {
      const total = newInvoice.items.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0,
      );

      const res = await createInvoice({
        projectId: Number(projectId) || projectId,
        ...newInvoice,
        total,
      });

      if (res.success) {
        show("success", "Invoice created");
        setAddInvoiceOpen(false);
        setNewInvoice({
          clientName: "",
          issueDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10),
          items: [{ description: "Project Services", quantity: 1, rate: 0 }],
          status: "draft",
          notes: "",
        });

        // Optimistic / Local update
        setInvoices([res.data, ...invoices]);
        onUpdate?.();
      } else {
        show("error", res.error || "Failed to create invoice");
      }
    } catch (e) {
      show("error", "Error creating invoice");
    } finally {
      hideLoader();
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) return;
    showLoader("Adding expense...");
    try {
      const formData = new FormData();
      formData.append("projectId", String(projectId));
      formData.append("amount", newExpense.amount);
      formData.append("description", newExpense.description);
      formData.append("vendor", newExpense.vendor);
      formData.append("date", newExpense.date);

      const res = await addExpense(formData);

      if (res.success) {
        show("success", "Expense added");
        setAddExpenseOpen(false);
        setNewExpense({
          description: "",
          amount: "",
          date: new Date().toISOString().slice(0, 10),
          vendor: "",
        });

        // Local Update
        setExpenses([res.data, ...expenses]);
        onUpdate?.(); // Trigger parent refresh (for health score etc)
      } else {
        show("error", res.error || "Failed to add expense");
      }
    } catch (e) {
      show("error", "Error creating expense");
    } finally {
      hideLoader();
    }
  };

  const handleUpdateBudget = async () => {
    if (!newBudget || !projectUid) return;
    showLoader("Updating budget...");
    try {
      const res = await updateProjectBudget(projectUid, parseFloat(newBudget));

      if (res.success) {
        show("success", "Budget updated");
        setEditBudgetOpen(false);
        onUpdate?.();
      } else {
        show("error", res.error || "Failed to update budget");
      }
    } catch (e) {
      show("error", "Error updating budget");
    } finally {
      hideLoader();
    }
  };

  const handlePayNow = async (invoiceId: string) => {
    showLoader("Preparing checkout...");
    try {
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, projectId: projectId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        show("error", data.error || "Failed to create checkout session");
      }
    } catch (e) {
      show("error", "Payment initialization failed");
    } finally {
      hideLoader();
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  const stats = {
    budget: budget,
    spent: spent, // Or calculate from local expenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    // Actually, prefer the prop 'spent' if it comes from the DB aggregation we just fixed.
    // If we rely on local aggregation, we might miss expenses not loaded.
    remaining: Math.max(0, budget - spent),
    percentUsed: budget > 0 ? (spent / budget) * 100 : 0,
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b pb-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "expenses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "invoices"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab("budget")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "budget"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Budget Settings
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Budget
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.budget)}
                </div>
                <p className="text-xs text-muted-foreground">Target limit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spent
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.spent)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stats.percentUsed > 100 ? "bg-red-500" : "bg-orange-500"}`}
                      style={{ width: `${Math.min(stats.percentUsed, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {Math.round(stats.percentUsed)}%
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${stats.remaining === 0 && stats.budget > 0 ? "text-red-500" : "text-green-600"}`}
                >
                  {formatCurrency(stats.remaining)}
                </div>
                <p className="text-xs text-muted-foreground">Available funds</p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "expenses" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <Button size="sm" onClick={() => setAddExpenseOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left min-w-[100px]">Date</th>
                        <th className="p-3 text-left min-w-[200px]">
                          Description
                        </th>
                        <th className="p-3 text-left min-w-[100px]">Vendor</th>
                        <th className="p-3 text-right min-w-[100px]">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id} className="border-t">
                          <td className="p-3">
                            {new Date(e.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {e.note || e.description || "—"}
                          </td>
                          <td className="p-3">{e.vendor || "—"}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(e.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "invoices" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Button size="sm" onClick={() => setAddInvoiceOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Create Invoice
              </Button>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invoices found.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left min-w-[100px]">Date</th>
                        <th className="p-3 text-left min-w-[150px]">Client</th>
                        <th className="p-3 text-left min-w-[100px]">Status</th>
                        <th className="p-3 text-right min-w-[100px]">Total</th>
                        <th className="p-3 text-right w-[100px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((i) => (
                        <tr key={i.id} className="border-t">
                          <td className="p-3">
                            {new Date(i.issueDate).toLocaleDateString()}
                          </td>
                          <td className="p-3">{i.clientName || "—"}</td>
                          <td className="p-3">
                            <Badge
                              variant={
                                i.status === "paid" ? "default" : "secondary"
                              }
                            >
                              {i.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(i.total)}
                          </td>
                          <td className="p-3 text-right">
                            {i.status !== "paid" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayNow(i.id)}
                              >
                                Pay Now
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "budget" && (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Budget Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Total Project Budget
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    placeholder="0.00"
                  />
                  <Button onClick={handleUpdateBudget}>Save</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This amount determines the spending limit and tracking
                  metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <Modal open={addExpenseOpen} onOpenChange={setAddExpenseOpen} size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Add New Expense</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Description</label>
              <Input
                value={newExpense.description}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
                placeholder="e.g., Server Costs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Vendor (Optional)</label>
              <Input
                value={newExpense.vendor}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, vendor: e.target.value })
                }
                placeholder="e.g., AWS"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Amount</label>
                <Input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Date</label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleAddExpense}>
                Add Expense
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddExpenseOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={addInvoiceOpen} onOpenChange={setAddInvoiceOpen} size="md">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create New Invoice</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Client Name</label>
              <Input
                value={newInvoice.clientName}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, clientName: e.target.value })
                }
                placeholder="Client Name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Item Description</label>
              <Input
                value={newInvoice.items[0].description}
                onChange={(e) => {
                  const newItems = [...newInvoice.items];
                  newItems[0].description = e.target.value;
                  setNewInvoice({ ...newInvoice, items: newItems });
                }}
                placeholder="Service or Product"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Rate</label>
                <Input
                  type="number"
                  value={newInvoice.items[0].rate}
                  onChange={(e) => {
                    const newItems = [...newInvoice.items];
                    newItems[0].rate = parseFloat(e.target.value);
                    setNewInvoice({ ...newInvoice, items: newItems });
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Quantity</label>
                <Input
                  type="number"
                  value={newInvoice.items[0].quantity}
                  onChange={(e) => {
                    const newItems = [...newInvoice.items];
                    newItems[0].quantity = parseFloat(e.target.value);
                    setNewInvoice({ ...newInvoice, items: newItems });
                  }}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Due Date</label>
              <Input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                }
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleCreateInvoice}>
                Create Invoice (
                {formatCurrency(
                  newInvoice.items[0].rate * newInvoice.items[0].quantity,
                )}
                )
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAddInvoiceOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
