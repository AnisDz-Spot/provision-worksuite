"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils";

interface FinancialStats {
  totalBudget: number;
  totalSpent: number;
  totalInvoiced: number;
  totalPaid: number;
}

export function FinancialRadar() {
  const [data, setData] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinance() {
      try {
        const res = await fetch("/api/analytics/financial-radar");
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch financial radar:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchFinance();
  }, []);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const spendPercentage = data
    ? Math.min((data.totalSpent / data.totalBudget) * 100, 100)
    : 0;
  const collectionRate = data ? (data.totalPaid / data.totalInvoiced) * 100 : 0;

  return (
    <Card className="h-full overflow-hidden border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Financial Health Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Main Budget Progress */}
        <div className="relative group">
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Portfolio Budget Utilization
              </p>
              <h3 className="text-2xl font-black">
                {formatCurrency(data?.totalSpent || 0)}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  / {formatCurrency(data?.totalBudget || 0)}
                </span>
              </h3>
            </div>
            <div className="text-right">
              <Badge
                variant={
                  spendPercentage > 85 ? "warning" : ("secondary" as any)
                }
                className="mb-1"
              >
                {spendPercentage.toFixed(1)}%
              </Badge>
            </div>
          </div>

          <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border/50">
            <div
              className={`h-full transition-all duration-1000 ease-out rounded-full ${spendPercentage > 90 ? "bg-red-500" : spendPercentage > 70 ? "bg-orange-500" : "bg-primary"}`}
              style={{ width: `${spendPercentage}%` }}
            />
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Invoiced vs Paid */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">
              Total Invoiced
            </p>
            <p className="text-lg font-bold">
              {formatCurrency(data?.totalInvoiced || 0)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>{collectionRate.toFixed(1)}% Collected</span>
            </div>
          </div>

          {/* Outstanding */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/40 relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">
              Outstanding
            </p>
            <p className="text-lg font-bold text-orange-600">
              {formatCurrency(
                (data?.totalInvoiced || 0) - (data?.totalPaid || 0),
              )}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Expected by EOFY</span>
            </div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 bg-primary/5">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                Burn Rate is Optimal
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                Monthly spending is 12% below projected ceiling.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-muted text-muted-foreground",
    warning: "bg-orange-500 text-white",
    destructive: "bg-red-500 text-white",
    outline: "border border-border text-muted-foreground",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${variants[variant || "primary"]} ${className || ""}`}
    >
      {children}
    </span>
  );
}
