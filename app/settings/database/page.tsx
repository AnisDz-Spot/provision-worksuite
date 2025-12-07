"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function DatabaseSettingsPage() {
  const router = useRouter();
  const [license, setLicense] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">(
    "checking"
  );

  useEffect(() => {
    // Basic check if data mode is real
    const mode = localStorage.getItem("pv:dataMode");
    if (mode === "mock") {
      router.replace("/");
    } else {
      setStatus("valid"); // Assume valid if they passed onboarding
    }
  }, [router]);

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Configuration</h1>
        <p className="text-muted-foreground">
          Your database connection is managed via System Environment Variables.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold mb-2">Connection String</h3>
            <p className="text-sm text-slate-500 mb-4">
              The application is currently connected securely using the{" "}
              <code>POSTGRES_URL</code> environment variable.
            </p>
            <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              System Operational
            </div>
          </div>

          <div className="text-sm text-slate-500">
            <p>
              To change your database connection, update the environment
              variables in your hosting provider or local <code>.env</code> file
              and restart the application.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
