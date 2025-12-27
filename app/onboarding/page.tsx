"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Database, CheckCircle2 } from "lucide-react";
import { DatabaseConfigForm } from "@/components/setup/DatabaseConfigForm";
import { useAuth } from "@/components/auth/AuthContext";
import { log } from "@/lib/logger";
import { initializeSchema } from "@/app/settings/database/actions";
import { markDatabaseConfigured } from "@/lib/setup";
import { hasValidLicense } from "@/lib/license";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<"config" | "success" | "detected">("config");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [detectedData, setDetectedData] = useState<any>(null);

  useEffect(() => {
    // Check for valid license first
    if (!hasValidLicense()) {
      router.replace("/license-activation");
      return;
    }

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

    // If mode is not chosen yet, wait for AppShell to handle it
    if (!mode) {
      console.log("[Onboarding] Waiting for data mode to be defined...");
      return;
    }

    if (mode === "mock") {
      // In demo mode, we shouldn't be here. Mark done and go home immediately.
      localStorage.setItem("pv:onboardingDone", "true");
      router.replace("/");
      return;
    }

    try {
      const res = await fetch("/api/setup/check-system");
      const data = await res.json();

      if (data.ready && data.dbConfigured && data.hasTables) {
        // Already configured AND has tables
        if (isAuthenticated) {
          localStorage.setItem("pv:onboardingDone", "true");
          router.replace("/setup/account");
        } else {
          router.replace("/setup/account");
        }
        return;
      }

      // AUTO-DETECT: If DB is configured (env vars) but tables missing
      if (data.ready && data.dbConfigured && !data.hasTables) {
        console.log(
          "📡 AUTO-DETECT: DB Connection found via environment variables."
        );
        setDetectedData(data);
        setStep("detected");
      }
    } catch (e) {
      log.error({ err: e }, "Setup check failed");
    } finally {
      setChecking(false);
    }
  }

  async function handleAutoInitialize() {
    setError(null);
    setIsSaving(true);
    try {
      const result = await initializeSchema();
      if (result.success) {
        // Update client state
        markDatabaseConfigured(true);
        localStorage.setItem("pv:dataMode", "live");

        setStep("success");
        // Redirect to account setup after short delay
        setTimeout(() => {
          router.push("/setup/account");
        }, 2000);
      } else {
        throw new Error(result.message || "Schema initialization failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to initialize database");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(
    dbUrl: string,
    dbType: string,
    storageConfig?: {
      provider: string;
      s3Bucket?: string;
      s3Region?: string;
      s3AccessKey?: string;
      s3SecretKey?: string;
      s3Endpoint?: string;
      blobToken?: string;
    }
  ) {
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/setup/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postgresUrl: dbUrl,
          dbType,
          storageConfig,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Configuration failed");
      }

      if (data.warning) {
        // Show warning but proceed
        setError(data.warning); // Show as error/warning text
        if (typeof window !== "undefined") {
          window.alert(`Warning: ${data.warning}`);
        }
      }

      // Save to localStorage for client-side persistence
      localStorage.setItem(
        "pv:dbConfig",
        JSON.stringify({ dbType, configured: true })
      );

      // Save storage config to localStorage
      if (storageConfig) {
        localStorage.setItem("pv:storageConfig", JSON.stringify(storageConfig));
      }

      markDatabaseConfigured(true);
      localStorage.setItem("pv:dataMode", "live");

      setStep("success");

      // Redirect to account setup after a short delay
      setTimeout(() => {
        router.push("/setup/account");
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
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center border border-emerald-100 dark:border-emerald-900/30">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Database Ready!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Redirecting to account setup...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        </div>
      </div>
    );
  }

  if (step === "detected") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden">
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-6 text-center">
            <Database className="w-12 h-12 text-white mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white mb-1">
              Connection Detected!
            </h1>
            <p className="text-indigo-100 text-sm">
              We found an existing database configuration.
            </p>
          </div>

          <div className="p-8">
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  System Environment Match
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                A {detectedData?.provider || "PostgreSQL"} connection is already
                configured in your environment. You can use it directly to
                initialize your workspace.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleAutoInitialize}
                disabled={isSaving}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initializing Workspace...
                  </>
                ) : (
                  "Use Detected Connection & Initialize"
                )}
              </button>

              <button
                onClick={() => setStep("config")}
                disabled={isSaving}
                className="w-full py-3 text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                Use a different connection string
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>
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
