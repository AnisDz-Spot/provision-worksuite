"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Database,
  Key,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"mode" | "license" | "db">("mode");
  const [dataMode, setDataMode] = useState<"real" | "mock" | null>(null);
  const [license, setLicense] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseValid, setLicenseValid] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  // DB Config State
  const [dbTested, setDbTested] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Fallback Config State
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [dbUrl, setDbUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Timer state
  // 3 minutes = 180 seconds
  const [timeLeft, setTimeLeft] = useState<number>(180);

  useEffect(() => {
    // Only run timer if we are in setup flow (not mock) and not done yet (dbTested true means effectively done with config)
    // If they choose demo mode, we stop.
    // If they finish setup (dbTested), we stop.

    if (dataMode === "mock" || dbTested) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Timeout reached
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [dataMode, dbTested]);

  const handleTimeout = () => {
    // Force Demo Mode
    setDataMode("mock");
    if (typeof window !== "undefined") {
      localStorage.setItem("pv:dataMode", "mock");
      localStorage.setItem("pv:onboardingDone", "true");
      alert("Setup time expired. Switching to Demo Mode.");
      window.location.href = "/";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDashboard = () => {
    router.push("/");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Step 1: Mode selection
  if (step === "mode") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4 relative">
        {/* Timer Display */}
        <div className="absolute top-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full font-mono font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm">
          Setup Time:{" "}
          <span className={timeLeft < 60 ? "text-red-500" : "text-indigo-600"}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="w-full max-w-2xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
                Welcome aboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
                Choose how you'd like to get started with your application
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  setDataMode("mock");
                  if (typeof window !== "undefined") {
                    // Seed data for a rich demo experience
                    const { seedLocalData } = await import("@/lib/seedData");
                    seedLocalData();
                    localStorage.setItem("pv:dataMode", "mock");
                    localStorage.setItem("pv:onboardingDone", "true");
                    window.location.href = "/";
                  }
                }}
                className="group relative overflow-hidden bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-650 dark:hover:to-slate-750 border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 dark:group-hover:from-indigo-500/10 dark:group-hover:to-purple-500/10 transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-slate-600 dark:text-slate-200" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    Demo Mode
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    Explore with sample data. Perfect for testing and getting
                    familiar with features.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    <Check className="w-4 h-4" />
                    Instant setup
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setDataMode("real");
                  setStep("license");
                }}
                className="group relative overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-indigo-400/20"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Production Mode
                  </h3>
                  <p className="text-indigo-100 text-sm mb-4">
                    Connect your database and start working with real data right
                    away.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white font-medium">
                    <Check className="w-4 h-4" />
                    Full capabilities
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: License activation for real data mode
  if (step === "license" && dataMode === "real") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4 relative">
        <div className="absolute top-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full font-mono font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm">
          Setup Time:{" "}
          <span className={timeLeft < 60 ? "text-red-500" : "text-indigo-600"}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <div className="w-16 h-1 bg-indigo-600 rounded"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 md:p-10">
            <button
              onClick={() => {
                setDataMode(null);
                setStep("mode");
              }}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 mb-4 shadow-lg">
                <Key className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                License Activation
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Enter your serial number to activate your app. You must activate
                before configuring your database.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="Enter your serial number"
                  value={license}
                  onChange={(e) => setLicense(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              {licenseError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {licenseError}
                  </p>
                </div>
              )}

              <button
                onClick={async () => {
                  setLicenseLoading(true);
                  setLicenseError(null);
                  try {
                    const resp = await fetch("/api/check-license", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ serial: license }),
                    });
                    const data = await resp.json();
                    if (data.success) {
                      setLicenseValid(true);
                      setStep("db");
                    } else {
                      setLicenseError(
                        data.error ||
                          "Invalid serial number. Please check and try again."
                      );
                    }
                  } catch (err) {
                    setLicenseError("Network or server error");
                  } finally {
                    setLicenseLoading(false);
                  }
                }}
                disabled={!license || licenseLoading}
                className="w-full py-3.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all disabled:cursor-not-allowed"
              >
                {licenseLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Validating...
                  </span>
                ) : (
                  "Activate & Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: System Configuration Check (With Fallback)
  if (step === "db" && dataMode === "real") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4 relative">
        <div className="absolute top-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full font-mono font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-sm">
          Setup Time:{" "}
          <span className={timeLeft < 60 ? "text-red-500" : "text-indigo-600"}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="w-full max-w-2xl">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <div className="w-16 h-1 bg-indigo-600 rounded"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <div className="w-16 h-1 bg-indigo-600 rounded"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 md:p-10">
            <button
              onClick={() => setStep("license")}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 mb-4 shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                System Configuration
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Verifying your server environment
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Environment Check
                </h3>

                {!showConfigForm ? (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Checking for <code>POSTGRES_URL</code> in environment
                      variables...
                    </p>

                    {dbTested && !dbError && (
                      <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Check className="w-5 h-5" />
                        </div>
                        Configuration valid! Database connected.
                      </div>
                    )}

                    {dbError && (
                      <div className="flex flex-col gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 mt-0.5 shrink-0">⚠️</div>
                          <div>
                            <p className="font-medium mb-1">
                              Configuration Missing
                            </p>
                            <p className="text-sm opacity-90">{dbError}</p>
                          </div>
                        </div>
                        {/* Fallback Trigger */}
                        <button
                          onClick={() => {
                            setShowConfigForm(true);
                            setDbError(null);
                          }}
                          className="mt-2 text-sm underline text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 font-medium text-left"
                        >
                          I cannot set Environment Variables. Configure manually
                          →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Manual Configuration Form */
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Database Connection String
                      </label>
                      <input
                        type="text"
                        placeholder="postgres://user:password@host:port/dbname"
                        value={dbUrl}
                        onChange={(e) => setDbUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-sm"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        This will be written to a local <code>.env</code> file.
                        Ensure your server environment supports persistent
                        files.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          setIsSaving(true);
                          setDbError(null);
                          try {
                            const res = await fetch("/api/setup/config", {
                              method: "POST",
                              body: JSON.stringify({ postgresUrl: dbUrl }),
                              headers: { "Content-Type": "application/json" },
                            });
                            if (res.ok) {
                              // Re-run check
                              const check = await fetch(
                                "/api/setup/check-system"
                              );
                              const data = await check.json();
                              if (data.ready) {
                                setDbTested(true);
                                setShowConfigForm(false);
                              } else {
                                setDbError(
                                  data.error || "Saved, but connection failed."
                                );
                              }
                            } else {
                              const err = await res.json();
                              setDbError(
                                err.error || "Failed to save configuration"
                              );
                            }
                          } catch (e: any) {
                            setDbError("Error: " + e.message);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving || !dbUrl}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save & Connect"}
                      </button>
                      <button
                        onClick={() => setShowConfigForm(false)}
                        className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                    {dbError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        {dbError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {!dbTested ? (
                !showConfigForm && (
                  <button
                    onClick={async () => {
                      setDbError(null);
                      setLicenseLoading(true); // Reuse loading state
                      try {
                        const res = await fetch("/api/setup/check-system");
                        const data = await res.json();

                        if (data.ready) {
                          setDbTested(true);
                        } else {
                          // If check fails, we show error which triggers the fallback UI option
                          setDbError(
                            data.error ||
                              "System check failed. No configuration found."
                          );
                        }
                      } catch (e: any) {
                        setDbError("Network error: " + e.message);
                      } finally {
                        setLicenseLoading(false);
                      }
                    }}
                    disabled={licenseLoading}
                    className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {licenseLoading ? "Verifying..." : "Verify Configuration"}
                  </button>
                )
              ) : (
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.setItem("pv:dataMode", "real");
                      localStorage.setItem("pv:onboardingDone", "true");
                      localStorage.setItem(
                        "pv:setupStatus",
                        JSON.stringify({
                          databaseConfigured: true,
                          profileCompleted: false,
                        })
                      );
                      // Redirect to register to create the admin account
                      window.location.href = "/auth/register?flow=onboarding";
                    }
                  }}
                  className="w-full py-3.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Initialize System & Create Admin
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => {
                  setDataMode("mock");
                  setStep("mode");
                }}
                className="w-full py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
              >
                Switch to Demo Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
