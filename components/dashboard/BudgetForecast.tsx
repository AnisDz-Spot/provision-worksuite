"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Calendar,
  Loader2,
  PieChart,
} from "lucide-react";
import { format, parseISO, isAfter } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";

interface Forecast {
  projectId: string;
  projectName: string;
  budget: number;
  totalSpent: number;
  remainingBudget: number;
  dailyBurnRate: string;
  exhaustionDate: string | null;
  predictedOverage: string;
  predictedTotalSpend: string;
  riskLevel: "high" | "medium" | "low";
  isOverBudget: boolean;
}

export function BudgetForecast() {
  const [data, setData] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/analytics/budget-forecast");
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch budget forecasts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="h-full border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary" />
            Budget Overage Forecasting
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          Budget Overage Forecasting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pt-2">
          {data.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 italic">
              No active projects with budget data to forecast.
            </p>
          ) : (
            data.map((f) => {
              const utilPercent = (f.totalSpent / f.budget) * 100;
              const forecastPercent =
                (Number(f.predictedTotalSpend) / f.budget) * 100;

              return (
                <div key={f.projectId} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold tracking-tight truncate max-w-[150px]">
                        {f.projectName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        Burn:{" "}
                        <span className="font-bold text-foreground">
                          {formatCurrency(Number(f.dailyBurnRate))}
                        </span>
                        /day
                      </p>
                    </div>
                    <Badge
                      variant={
                        (f.riskLevel === "high"
                          ? "warning"
                          : f.riskLevel === "medium"
                            ? "info"
                            : "success") as any
                      }
                      className="text-[9px] uppercase font-bold"
                    >
                      {f.riskLevel} Risk
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span>Utilization: {utilPercent.toFixed(0)}%</span>
                      <span
                        className={cn(
                          Number(f.predictedTotalSpend) > f.budget
                            ? "text-orange-500 font-bold"
                            : "text-muted-foreground",
                        )}
                      >
                        Predicted: {forecastPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          f.isOverBudget ? "bg-red-500" : "bg-primary",
                        )}
                        style={{ width: `${Math.min(100, utilPercent)}%` }}
                      />
                      {forecastPercent > utilPercent && (
                        <div
                          className="absolute top-0 h-full bg-orange-500/30 transition-all duration-500"
                          style={{
                            left: `${Math.min(100, utilPercent)}%`,
                            width: `${Math.min(100 - utilPercent, forecastPercent - utilPercent)}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-muted/30 p-2 rounded border border-border/40">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground uppercase text-[8px] font-bold">
                        Planned Budget
                      </span>
                      <span className="font-bold">
                        {formatCurrency(f.budget)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span className="text-muted-foreground uppercase text-[8px] font-bold">
                        Predicted Overage
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          Number(f.predictedOverage) > 0
                            ? "text-orange-500"
                            : "text-green-500",
                        )}
                      >
                        {Number(f.predictedOverage) > 0
                          ? `+${formatCurrency(Number(f.predictedOverage))}`
                          : "None"}
                      </span>
                    </div>
                  </div>

                  {f.riskLevel !== "low" && f.exhaustionDate && (
                    <div className="flex items-center gap-1.5 px-1 py-0.5 bg-orange-500/5 rounded">
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                      <p className="text-[9px] text-orange-600 font-medium">
                        Budget exhaustion predicted around{" "}
                        <span className="font-bold">
                          {format(parseISO(f.exhaustionDate), "MMM d, yyyy")}
                        </span>
                        .
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
