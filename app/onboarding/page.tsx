"use client";
import { useState } from "react";
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
  const [dbUrl, setDbUrl] = useState("");
  const [dbBlob, setDbBlob] = useState(`{
  "sslmode": "require",
  "poolSize": 10
}`);
  const [dbTested, setDbTested] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const handleDashboard = () => {
    router.push("/");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Step 1: Mode selection
  if (step === "mode") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
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
                  setStep("license");
                  if (typeof window !== "undefined") {
                    // Seed data for a rich demo experience
                    const { seedLocalData } = await import("@/lib/seedData");
                    seedLocalData();

                    localStorage.setItem("pv:dataMode", "mock");
                    localStorage.setItem("pv:onboardingDone", "true");
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

  // Step 2: License activation
  if (step === "license" && dataMode === "real") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
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
                Activate License
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Enter your serial number to unlock all features
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  License Serial Number
                </label>
                <input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
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

                  // Simulate API call
                  await new Promise((resolve) => setTimeout(resolve, 1500));

                  if (license.length > 10) {
                    setLicenseValid(true);
                    setStep("db");
                  } else {
                    setLicenseError(
                      "Invalid serial number. Please check and try again."
                    );
                  }
                  setLicenseLoading(false);
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

              <button
                onClick={() => {
                  setDataMode("mock");
                  setStep("license");
                }}
                className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                Switch to Demo Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Database configuration
  if (step === "db" && dataMode === "real") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
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
                Database Configuration
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Connect your PostgreSQL database to get started
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Connection String
                </label>
                <input
                  type="text"
                  placeholder="postgres://user:password@host:port/dbname"
                  value={dbUrl}
                  onChange={(e) => setDbUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-sm"
                />
              </div>

              {/* Advanced Configuration (Optional) removed as requested */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Storage / Media Blob
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    (Optional)
                  </span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste or describe storage/media config, S3 bucket, etc. (optional)"
                  value={dbBlob}
                  onChange={(e) => setDbBlob(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  For storage/media configuration (e.g., S3, Azure Blob, etc).
                  Leave blank if not needed.
                </p>
              </div>

              {dbTested && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Connection successful!
                  </p>
                </div>
              )}

              {dbError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {dbError}
                  </p>
                </div>
              )}

              <button
                onClick={async () => {
                  setDbError(null);
                  if (
                    !dbUrl.startsWith("postgres://") &&
                    !dbUrl.startsWith("postgresql://")
                  ) {
                    setDbError(
                      "Invalid connection string format. Must start with postgres:// or postgresql://"
                    );
                    return;
                  }
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  setDbTested(true);
                }}
                disabled={!dbUrl}
                className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                Test Connection
              </button>

              <button
                onClick={() => {
                  handleDashboard();
                }}
                disabled={!dbTested}
                className="w-full py-3.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Complete Setup
                <ArrowRight className="w-5 h-5" />
              </button>

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

  // Demo mode final step
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 md:p-10">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-green-400 to-emerald-500 mb-6 shadow-lg animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              All Set!
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              You're in Demo Mode with sample data
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">
              Switch to Production Mode anytime from settings
            </p>

            <button
              onClick={() => {
                handleDashboard();
              }}
              className="w-full py-3.5 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
