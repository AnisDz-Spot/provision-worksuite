"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/finance/ProgressBar";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { DollarSign, Clock, Receipt } from "lucide-react";

type Project = { id: string; name: string; budget?: number };
type Totals = Record<
  string,
  {
    expenseTotal: number;
    timeCost: number;
    budget: number;
    revenue: number;
  }
>;

interface BudgetTrackerProps {
  projects: Project[];
  totals: Totals;
  currency: (n: number) => string;
}

export function BudgetTracker({
  projects,
  totals,
  currency,
}: BudgetTrackerProps) {
  return (
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
  );
}
