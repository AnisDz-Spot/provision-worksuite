"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/finance/MetricCard";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { TrendingUp } from "lucide-react";

type Project = { id: string; name: string; revenue?: number; budget?: number };
type Totals = Record<
  string,
  {
    expenseTotal: number;
    timeCost: number;
    budget: number;
    revenue: number;
  }
>;

interface FinancialSummaryProps {
  projects: Project[];
  totals: Totals;
  currency: (n: number) => string;
}

export function FinancialSummary({
  projects,
  totals,
  currency,
}: FinancialSummaryProps) {
  const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
  const costsValues = Object.values(totals);
  const totalCosts = costsValues.reduce(
    (s, t) => s + t.expenseTotal + t.timeCost,
    0,
  );
  const netProfit = totalRevenue - totalCosts;

  return (
    <Card className="p-4">
      <SectionHeader
        icon={<TrendingUp className="w-4 h-4" />}
        title="Financial Reports"
      />
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <MetricCard title="Total Revenue" value={currency(totalRevenue)} />
        <MetricCard title="Total Costs" value={currency(totalCosts)} />
        <MetricCard title="Net Profit" value={currency(netProfit)} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-3 border-2">
          <div className="font-medium mb-2">Cost Breakdown</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Time Costs</span>
              <span className="font-medium">
                {currency(costsValues.reduce((s, t) => s + t.timeCost, 0))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Expenses</span>
              <span className="font-medium">
                {currency(costsValues.reduce((s, t) => s + t.expenseTotal, 0))}
              </span>
            </div>
          </div>
        </Card>
        <Card className="p-3 border-2">
          <div className="font-medium mb-2">Budget Health</div>
          <div className="space-y-2 max-h-[120px] overflow-y-auto">
            {projects.map((p) => {
              const t = totals[p.id] || {
                expenseTotal: 0,
                timeCost: 0,
                budget: 0,
              };
              const actual = t.expenseTotal + t.timeCost;
              const pct = p.budget ? Math.round((actual / p.budget) * 100) : 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{p.name}</span>
                  <Badge
                    variant={
                      pct >= 100
                        ? "warning"
                        : pct >= 90
                          ? "secondary"
                          : "default"
                    }
                    className="text-[10px] h-5"
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
  );
}
