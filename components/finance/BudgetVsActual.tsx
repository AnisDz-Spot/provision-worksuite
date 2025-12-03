"use client";

import React, { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Download, AlertTriangle, TrendingUp } from "lucide-react";

type Item = { id: string; name: string; budget: number; actual: number };

// Mock data; in production pull from API or data store
const ITEMS: Item[] = [
  { id: "p1", name: "Website Redesign", budget: 25000, actual: 18250 },
  { id: "p2", name: "Mobile App MVP", budget: 60000, actual: 45500 },
  { id: "p3", name: "API Integration", budget: 15000, actual: 14200 },
];

export function BudgetVsActual() {
  const rows = useMemo(() => {
    return ITEMS.map((i) => {
      const remaining = Math.max(0, i.budget - i.actual);
      const percentUsed =
        i.budget > 0 ? Math.round((i.actual / i.budget) * 100) : 0;
      const risk: "low" | "medium" | "high" =
        percentUsed >= 95 ? "high" : percentUsed >= 85 ? "medium" : "low";
      const burnRate = Math.round(i.actual / Math.max(1, 30)); // naive daily
      return { ...i, remaining, percentUsed, risk, burnRate };
    });
  }, []);

  const exportCSV = () => {
    const csv = [
      ["Project", "Budget", "Actual", "% Used", "Remaining", "Burn/day"],
      ...rows.map((r) => [
        r.name,
        r.budget,
        r.actual,
        r.percentUsed,
        r.remaining,
        r.burnRate,
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-vs-actual-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Budget vs Actual</h3>
            <p className="text-sm text-muted-foreground">
              Tracking spend and remaining budget
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" />
          CSV
        </Button>
      </div>

      <table className="min-w-full text-sm">
        <thead className="bg-accent/20">
          <tr>
            <th className="p-3 text-left text-muted-foreground">Project</th>
            <th className="p-3 text-left text-muted-foreground">Budget</th>
            <th className="p-3 text-left text-muted-foreground">Actual</th>
            <th className="p-3 text-left text-muted-foreground">% Used</th>
            <th className="p-3 text-left text-muted-foreground">Remaining</th>
            <th className="p-3 text-left text-muted-foreground">Burn/day</th>
            <th className="p-3 text-left text-muted-foreground">Risk</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t [&:last-child>td]:border-b-0">
              <td className="p-3">{r.name}</td>
              <td className="p-3">${r.budget.toLocaleString()}</td>
              <td className="p-3">${r.actual.toLocaleString()}</td>
              <td className="p-3">
                <div className="min-w-32">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{r.percentUsed}%</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className={`h-full ${r.percentUsed >= 95 ? "bg-red-500" : r.percentUsed >= 85 ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${r.percentUsed}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="p-3">${r.remaining.toLocaleString()}</td>
              <td className="p-3">${r.burnRate.toLocaleString()}</td>
              <td className="p-3">
                <Badge
                  variant={
                    r.risk === "high"
                      ? "warning"
                      : r.risk === "medium"
                        ? "info"
                        : "success"
                  }
                  pill
                >
                  {r.risk.toUpperCase()}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rows.some((r) => r.risk !== "low") && (
        <div className="mt-4 p-3 border rounded bg-amber-500/10 border-amber-500/20 text-amber-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Increasing burn detected. Consider scope reduction or reallocation.
        </div>
      )}
    </Card>
  );
}
