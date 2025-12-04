"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, CalendarDays } from "lucide-react";

type Invoice = {
  id: string;
  customer: string;
  amount: number;
  dueDate: string;
  status: "paid" | "unpaid";
};

// Mock invoices; replace with real data source
const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-101",
    customer: "Acme Co.",
    amount: 5200,
    dueDate: "2025-11-10",
    status: "unpaid",
  },
  {
    id: "inv-102",
    customer: "Globex",
    amount: 7800,
    dueDate: "2025-10-20",
    status: "unpaid",
  },
  {
    id: "inv-103",
    customer: "Soylent",
    amount: 1200,
    dueDate: "2025-09-12",
    status: "unpaid",
  },
  {
    id: "inv-104",
    customer: "Initech",
    amount: 9600,
    dueDate: "2025-12-01",
    status: "unpaid",
  },
  {
    id: "inv-105",
    customer: "Hooli",
    amount: 4300,
    dueDate: "2025-08-15",
    status: "unpaid",
  },
  {
    id: "inv-106",
    customer: "Vehement",
    amount: 2000,
    dueDate: "2025-11-25",
    status: "paid",
  },
];

export function InvoiceAging() {
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Primary: Attempt to fetch from API
        const res = await fetch("/api/invoices").then((r) => r.json());

        if (res?.success && Array.isArray(res.data)) {
          // Assuming API returns data that maps to Invoice[] type
          const apiInvoices: Invoice[] = res.data.map((i: any) => ({
            id: String(i.id),
            customer: i.customer_name || i.customer,
            amount: parseFloat(i.amount),
            dueDate: i.due_date,
            status: i.status === "paid" ? "paid" : "unpaid",
          }));
          setInvoices(apiInvoices);
          return;
        }
        throw new Error("DB not configured or API error");
      } catch {
        // Fallback: Use local mock data
        console.warn("API fetch failed for Invoices, using mock data.");
        setInvoices(MOCK_INVOICES);
      }
    };
    loadData();
  }, []); // Run once on mount

  const buckets = useMemo(() => {
    const now = new Date();
    // Use the current date for calculating days overdue
    const diffDays = (d: string) =>
      Math.floor(
        (now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)
      );
    const open = invoices.filter((i) => i.status === "unpaid");
    const b = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 } as Record<
      string,
      number
    >;
    const list = {
      "0-30": [] as Invoice[],
      "31-60": [] as Invoice[],
      "61-90": [] as Invoice[],
      "90+": [] as Invoice[],
    };
    for (const i of open) {
      const d = diffDays(i.dueDate);
      // Logic for aging buckets is based on how many days the invoice is PAST the due date (d > 0)
      if (d > 90) {
        // 90+ days overdue
        b["90+"] += i.amount;
        list["90+"].push(i);
      } else if (d > 60) {
        // 61-90 days overdue
        b["61-90"] += i.amount;
        list["61-90"].push(i);
      } else if (d > 30) {
        // 31-60 days overdue
        b["31-60"] += i.amount;
        list["31-60"].push(i);
      } else if (d > 0) {
        // 1-30 days overdue
        b["0-30"] += i.amount;
        list["0-30"].push(i);
      }
      // Note: Invoices that are not yet due (d <= 0) are correctly ignored by the logic above
      // as they are not "overdue" according to the current bucket definitions.
    }
    const total = Object.values(b).reduce((a, v) => a + v, 0);
    return { totals: b, list, total };
  }, [invoices]); // Recalculate when invoices change

  const exportCSV = () => {
    const rows: string[][] = [
      ["Bucket", "Invoice", "Customer", "Amount", "DueDate"],
    ];
    Object.entries(buckets.list).forEach(([bucket, arr]) => {
      arr.forEach((i) =>
        rows.push([bucket, i.id, i.customer, String(i.amount), i.dueDate])
      );
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-aging-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Invoice Aging</h3>
            <p className="text-sm text-muted-foreground">
              Open receivables by days overdue
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" />
          CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {(["0-30", "31-60", "61-90", "90+"] as const).map((key) => (
          <div key={key} className="p-3 rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">
              {key} days overdue
            </div>
            <div
              className={`text-xl font-bold ${key === "90+" ? "text-red-600" : key === "61-90" ? "text-amber-600" : "text-foreground"}`}
            >
              ${buckets.totals[key].toLocaleString()}
            </div>
          </div>
        ))}
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">
            Total Overdue
          </div>
          <div className="text-xl font-bold">
            ${buckets.total.toLocaleString()}
          </div>
        </div>
      </div>

      <table className="min-w-full text-sm">
        <thead className="bg-accent/20">
          <tr>
            <th className="p-3 text-left text-muted-foreground">Invoice</th>
            <th className="p-3 text-left text-muted-foreground">Customer</th>
            <th className="p-3 text-left text-muted-foreground">Amount</th>
            <th className="p-3 text-left text-muted-foreground">Due Date</th>
            <th className="p-3 text-left text-muted-foreground">Bucket</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(buckets.list).map(([bucket, arr]) =>
            arr.map((i) => (
              <tr key={i.id} className="border-t [&:last-child>td]:border-b-0">
                <td className="p-3">{i.id}</td>
                <td className="p-3">{i.customer}</td>
                <td className="p-3">${i.amount.toLocaleString()}</td>
                <td className="p-3">
                  {new Date(i.dueDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3">{bucket}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}
