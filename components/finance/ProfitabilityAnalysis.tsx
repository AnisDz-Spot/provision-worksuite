"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Calculator, TrendingUp, Clock, Receipt } from "lucide-react";

type Project = { id: string; name: string; revenue?: number };
type Totals = Record<
  string,
  {
    expenseTotal: number;
    timeCost: number;
    budget: number;
    revenue: number;
  }
>;

interface ProfitabilityAnalysisProps {
  projects: Project[];
  totals: Totals;
  currency: (n: number) => string;
}

export function ProfitabilityAnalysis({
  projects,
  totals,
  currency,
}: ProfitabilityAnalysisProps) {
  const totalRevenue = projects.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalProfit = projects.reduce((s, p) => {
    const t = totals[p.id] || { expenseTotal: 0, timeCost: 0 };
    return s + ((p.revenue || 0) - (t.expenseTotal + t.timeCost));
  }, 0);
  const overallMargin =
    totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
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
          const t = totals[p.id] || { expenseTotal: 0, timeCost: 0 };
          const costs = t.expenseTotal + t.timeCost;
          const profit = (p.revenue || 0) - costs;
          const profitable = profit >= 0;
          const margin = p.revenue ? Math.round((profit / p.revenue) * 100) : 0;

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

      <Card className="mt-6 p-5 bg-linear-to-br from-green-500/10 to-blue-500/10 border-2 border-green-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Total Portfolio Profit
            </div>
            <div className="text-3xl font-bold text-green-600">
              {currency(totalProfit)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground mb-1">
              Overall Margin
            </div>
            <div className="text-2xl font-bold">{overallMargin}%</div>
          </div>
        </div>
      </Card>
    </Card>
  );
}
