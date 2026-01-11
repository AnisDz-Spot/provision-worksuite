"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { isGlobalAdmin } from "@/lib/auth-utils";
import { useLoading } from "@/context/LoadingContext";
import { setDataModePreference } from "@/lib/dataSource";
import { markSetupComplete, hasDatabaseTables } from "@/lib/setup";
import { hasValidLicense } from "@/lib/license";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Server Actions
import {
  saveDatabaseConfig,
  getDatabaseStatus,
  resetConfiguration,
  initializeSchema,
} from "@/app/settings/database/actions";

export function DataSourceSettings() {
  const { currentUser } = useAuth();
  const isAdminGlobal = currentUser ? isGlobalAdmin(currentUser as any) : false;
  const router = useRouter();
  const { showLoader, hideLoader } = useLoading();

  const [dataMode, setDataMode] = useState<"real" | "mock" | null>(() => {
    if (typeof window === "undefined") return null;
    const val = localStorage.getItem("pv:dataMode");
    return val === "mock" || val === "real" ? val : null;
  });

  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    loadStatus();

    // Check for dbfail redirect
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("dbfail") === "1") {
        setMessage({
          type: "error",
          text: "Database connection failed. Please check your configuration.",
        });
      }
    }
  }, []);

  useEffect(() => {
    if (status) {
      markSetupComplete(
        status.hasDatabaseConfig || status.hasEnvironmentVars,
        status.isSetupComplete,
        status.hasTables
      );

      const isMissingEverything =
        !status.hasEnvironmentVars && !status.hasDatabaseConfig;
      setShowCustomForm(isMissingEverything);
      setLoading(false);
    }
  }, [status]);

  async function loadStatus() {
    setLoading(true);
    showLoader("Fetching system status...");
    try {
      const result = await getDatabaseStatus();
      setStatus(result);
    } finally {
      setLoading(false);
      hideLoader();
    }
  }

  const hasLicense = hasValidLicense();

  useEffect(() => {
    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const hasDbFail = params?.get("dbfail") === "1";

    if (hasLicense && dataMode !== "real" && !hasDbFail) {
      setDataMode("real");
      localStorage.setItem("pv:dataMode", "real");
      setDataModePreference("real");
    }
  }, [hasLicense, dataMode]);

  const handleDataModeChange = async (mode: "real" | "mock") => {
    if (hasLicense && mode === "mock") {
      alert("You have a valid license active. Demo mode is disabled.");
      return;
    }

    if (
      !confirm(
        `Switch to ${mode === "real" ? "Live" : "Demo"} mode? You will be logged out to apply changes.`
      )
    ) {
      return;
    }

    if (mode === "real" && !hasLicense) {
      router.push("/license-activation");
      return;
    }

    if (mode === "real" && hasLicense) {
      try {
        const checkRes = await fetch("/api/setup/check-users");
        const checkData = await checkRes.json();

        if (checkData.success && !checkData.hasMasterAdmin) {
          router.push("/setup/account");
          return;
        }
      } catch (error) {
        console.error("Error checking for master admin:", error);
      }
    }

    setDataMode(mode);
    setMessage(null);
    showLoader(`Switching to ${mode === "real" ? "Live" : "Demo"} mode...`);

    try {
      await fetchWithCsrf("/api/auth/logout", {
        method: "POST",
      });
    } catch (e) {
      console.error("Logout API failed", e);
    }

    localStorage.removeItem("pv:currentUser");
    localStorage.removeItem("pv:session");
    localStorage.setItem("pv:dataMode", mode);
    setDataModePreference(mode);

    if (mode === "mock") {
      const { seedLocalData } = await import("@/lib/seedData");
      seedLocalData();
      window.location.href = "/auth/login?mode=demo";
    } else {
      window.location.href = "/auth/login?mode=live";
    }
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setMessage(null);
    showLoader("Saving database configuration...");

    try {
      const result = await saveDatabaseConfig(formData);

      setLoading(false);
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });

      if (result.success) {
        await loadStatus();
      }
    } finally {
      hideLoader();
    }
  }

  async function handleReset() {
    if (
      !confirm(
        "Reset to environment variables? This will clear custom database credentials."
      )
    ) {
      return;
    }

    setLoading(true);
    const result = await resetConfiguration();
    setLoading(false);
    setMessage({
      type: "success",
      text: result.message,
    });
    await loadStatus();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <style>{`.sidebar, .Navbar { display: none !important; }`}</style>

      {isAdminGlobal && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Global Admin Override Active
          </AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            You are logged in as the Global Admin. For safety and compatibility
            during the initial setup phase, your session is{" "}
            <strong>always using Dummy Mode (Mock Data)</strong> regardless of
            the settings below.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Data Source Mode</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Choose between using real database data or dummy demo data.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={dataMode === "real" ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDataModeChange("real")}
          >
            Use Real Data (Live)
          </Button>
          <div className="relative group">
            <Button
              variant={dataMode === "mock" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleDataModeChange("mock")}
              disabled={hasLicense && dataMode === "real"}
              className={cn(
                hasLicense &&
                  dataMode === "real" &&
                  "opacity-50 cursor-not-allowed"
              )}
            >
              Use Dummy Data (Demo)
            </Button>
            {hasLicense && dataMode === "real" && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Demo mode is disabled when using a valid license
              </div>
            )}
          </div>
        </div>

        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-4"
          >
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {dataMode === "mock" && (
          <div className="mt-3 text-xs text-muted-foreground p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="mb-2">
              <strong>Demo Mode Active</strong>
            </p>
            <p>
              Fake Admin: <span className="font-mono">admin@provision.com</span>{" "}
              / <span className="font-mono">password123578951</span>
            </p>
          </div>
        )}

        {dataMode === "real" && (
          <div className="space-y-6 mt-6">
            {loading && !status && (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                <p>Checking database configuration...</p>
              </div>
            )}

            {status && status.hasEnvironmentVars && !status.hasTables && (
              <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
                <h3 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200">
                  Initialization Required
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                  Environment variables detected, but database tables are
                  missing. Initialize the database to start using Live mode.
                </p>

                <Button
                  onClick={async () => {
                    if (
                      !confirm(
                        "This will create all necessary tables in your database. Continue?"
                      )
                    )
                      return;
                    setLoading(true);
                    const res = await initializeSchema();
                    setLoading(false);
                    setMessage({
                      type: res.success ? "success" : "error",
                      text: res.message,
                    });
                    if (res.success) {
                      await loadStatus();
                      router.push("/setup/account");
                    }
                  }}
                  disabled={loading}
                  variant="primary"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {loading
                    ? "Initializing Schema..."
                    : "Initialize Database Tables"}
                </Button>
              </Card>
            )}

            {status &&
              status.hasTables &&
              (status.hasEnvironmentVars || status.hasDatabaseConfig) && (
                <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">
                        System Ready
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                        Database is configured and ready to use.
                        {status.currentSource === "environment"
                          ? " Using environment variables."
                          : " Using custom credentials."}
                      </p>
                    </div>
                  </div>

                  {!status.isSetupComplete && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                      <Button
                        variant="primary"
                        onClick={() => {
                          if (!hasValidLicense()) {
                            router.push("/license-activation");
                          } else {
                            setDataModePreference("real");
                            setDataMode("real");
                            router.push("/setup/account");
                          }
                        }}
                        className="w-full sm:w-auto"
                      >
                        Complete Setup Now →
                      </Button>
                    </div>
                  )}
                </Card>
              )}

            {status && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Configuration Status
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Source:</strong>{" "}
                    {status.currentSource === "database"
                      ? "🗄️ Database (Custom)"
                      : "🌍 Environment Variables"}
                  </p>
                  <p>
                    <strong>Environment Variables:</strong>{" "}
                    {status.hasEnvironmentVars ? "✅ Configured" : "❌ Missing"}
                  </p>
                  <p>
                    <strong>Custom Database Config:</strong>{" "}
                    {status.hasDatabaseConfig ? "✅ Configured" : "❌ Not Set"}
                  </p>
                  {status.hasTables !== undefined && (
                    <p>
                      <strong>Database Tables:</strong>{" "}
                      {status.hasTables ? "✅ Created" : "❌ Missing"}
                    </p>
                  )}
                </div>

                {status.recommendations.length > 0 && (
                  <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800">
                    <AlertDescription>
                      {status.recommendations.map((rec: string, i: number) => (
                        <div key={i}>{rec}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            )}

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Custom Database Credentials
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {status?.hasEnvironmentVars
                      ? "Optional: Override environment variables with custom credentials."
                      : "Configure database connection."}
                  </p>
                </div>
                {status?.hasEnvironmentVars && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomForm(!showCustomForm)}
                  >
                    {showCustomForm ? "Hide Form" : "Configure Override"}
                  </Button>
                )}
              </div>

              {(showCustomForm || !status?.hasEnvironmentVars) && (
                <form action={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Postgres URL
                    </label>
                    <Input
                      name="postgresUrl"
                      type="text"
                      placeholder="postgres://user:pass@host:5432/dbname"
                      required
                      className="font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Blob Storage Token
                    </label>
                    <Input
                      name="blobToken"
                      type="text"
                      placeholder="vercel_blob_rw_..."
                      required
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Button type="submit" disabled={loading}>
                      {loading
                        ? "Testing & Saving..."
                        : "Test & Save Configuration"}
                    </Button>

                    {status?.hasDatabaseConfig && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleReset}
                        disabled={loading}
                      >
                        Reset to Env Vars
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
