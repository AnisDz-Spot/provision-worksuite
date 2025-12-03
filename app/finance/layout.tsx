"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const tabs = [
    { href: "/finance", label: "Overview" },
    { href: "/finance/budgets", label: "Budgets" },
    { href: "/finance/billing", label: "Billing" },
    { href: "/finance/expenses", label: "Expenses" },
    { href: "/finance/invoices", label: "Invoices" },
    { href: "/finance/profitability", label: "Profitability" },
    { href: "/finance/reports", label: "Reports" },
  ];
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 flex flex-wrap items-center justify-start gap-2 border-b border-border pb-2">
        {tabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== "/finance" && pathname.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="text-left">{children}</div>
    </div>
  );
}
