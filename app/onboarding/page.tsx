"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Database, CheckCircle2 } from "lucide-react";
import { DatabaseConfigForm } from "@/components/setup/DatabaseConfigForm";
import { useAuth } from "@/components/auth/AuthContext";
import { log } from "@/lib/logger";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<"config" | "success">("config");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Wait for auth to initialize before checking setup state
    // This prevents race conditions where isAuthenticated is false temporarily
    const timer = setTimeout(() => {
      checkSetupStatus();
    }, 500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  async function checkSetupStatus() {
    // Check if we are in demo mode
    const mode = localStorage.getItem("pv:dataMode");
    const onboardingDone = localStorage.getItem("pv:onboardingDone");

    if (mode === "mock") {
      // In demo mode, we shouldn't be here. Mark done and go home.
      if (!onboardingDone) {
        localStorage.setItem("pv:onboardingDone", "true");
      }
      router.replace("/");
      return;
    }

    try {
      const res = await fetch("/api/setup/check-system");
      const data = await res.json();

      if (data.ready && data.dbConfigured) {
        // Already configured
        if (isAuthenticated) {
          // If already logged in, mark onboarding as done and go to account setup if profile pending
          localStorage.setItem("pv:onboardingDone", "true");
          router.replace("/settings?tab=profile&setup=true"); // 🔑 MODIFIED: Direct to account setup
        } else {
          // Otherwise go to registration
          router.replace("/auth/register?flow=onboarding");
        }
        return;
      }
    } catch (e) {
      log.error({ err: e }, "Setup check failed");
    } finally {
      setChecking(false);
    }
  }

  async function handleSave(dbUrl: string, dbType: string) {
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/setup/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postgresUrl: dbUrl, dbType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Configuration failed");
      }

      if (data.warning) {
        // Show warning but proceed
        setError(data.warning); // Show as error/warning text
        // Don't return, let it proceed to success step
        // But maybe delay or require user acknowledgement?
        // For now, let's just log and maybe show a non-blocking alert
        if (typeof window !== "undefined") {
          window.alert(`Warning: ${data.warning}`);
        }
      }

      // Save to localStorage for client-side persistence
      localStorage.setItem(
        "pv:dbConfig",
        JSON.stringify({ dbType, configured: true })
      );
      localStorage.setItem(
        "pv:setupStatus",
        JSON.stringify({ databaseConfigured: true, profileCompleted: false })
      );
      localStorage.setItem("pv:dataMode", "live");

      setStep("success");

      // Redirect to registration after a short delay
      setTimeout(() => {
        router.push("/auth/register?flow=onboarding");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    router.push("/");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Database Configured!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Redirecting to account setup...
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <Database className="w-12 h-12 text-white mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white mb-1">
            Database Configuration
          </h1>
          <p className="text-indigo-100 text-sm">
            Configure your database to get started
          </p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Connect Your Database
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose your database type and provide the connection string. We
              support PostgreSQL, MySQL, and SQLite.
            </p>
          </div>

          <DatabaseConfigForm
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
            error={error}
          />

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-blue-900 dark:text-blue-300">
              <strong>Note:</strong> Your connection string will be securely
              stored in a{" "}
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">
                .env
              </code>{" "}
              file on the server. Make sure your hosting environment supports
              persistent file storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
