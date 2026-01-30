"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/finance/MetricCard";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { TrendingUp } from "lucide-react";

type Invoice = {
  id: string;
  clientName: string;
  dueDate: string;
  status: string;
  total: number;
};
type Expense = { id: string; date: string; amount: number };

interface FinancialForecastProps {
  invoices: Invoice[];
  expenses: Expense[];
  currency: (n: number) => string;
}

export function FinancialForecast({
  invoices,
  expenses,
  currency,
}: FinancialForecastProps) {
  const ninetyDaysFromNow = new Date(Date.now() + 90 * 86400000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const expectedInflows = invoices
    .filter(
      (inv) =>
        inv.status !== "Paid" && new Date(inv.dueDate) <= ninetyDaysFromNow,
    )
    .reduce((s, inv) => s + inv.total, 0);

  const avgMonthlyExpenses = expenses
    .filter((e) => new Date(e.date) >= thirtyDaysAgo)
    .reduce((s, e) => s + e.amount, 0);

  const projectedExpenses = avgMonthlyExpenses * 3; // 90 days
  const netPosition = expectedInflows - projectedExpenses;

  const upcomingReceivables = invoices
    .filter(
      (inv) =>
        inv.status !== "Paid" && new Date(inv.dueDate) <= ninetyDaysFromNow,
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 5);

  return (
    <Card className="p-6">
      <SectionHeader
        icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
        title="Cash Flow Forecast"
        subtitle="Next 90 days projected cash position"
      />
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Expected Inflows"
          value={currency(expectedInflows)}
        />
        <MetricCard
          title="Projected Expenses"
          value={currency(projectedExpenses)}
        />
        <MetricCard title="Net Position" value={currency(netPosition)} />
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Upcoming Receivables</h3>
        {upcomingReceivables.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-4">
            No upcoming receivables
          </div>
        )}
        {upcomingReceivables.map((inv) => {
          const daysUntil = Math.ceil(
            (new Date(inv.dueDate).getTime() - Date.now()) / 86400000,
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
                  {daysUntil > 0
                    ? `${daysUntil} days`
                    : daysUntil === 0
                      ? "today"
                      : "overdue"}
                  )
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
      </div>
    </Card>
  );
}
