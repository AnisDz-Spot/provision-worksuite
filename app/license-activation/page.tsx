"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { validateLicense, storeLicense, DEV_LICENSES } from "@/lib/license";

export default function LicenseActivationPage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showDevKeys, setShowDevKeys] = useState(
    process.env.NODE_ENV === "development"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    // Validate license
    const validation = validateLicense(licenseKey);

    if (validation.valid) {
      // Store license
      storeLicense(licenseKey);

      // Redirect to onboarding
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } else {
      setError(validation.error || "Invalid license key");
      setIsValidating(false);
    }
  };

  const useDemoLicense = () => {
    setLicenseKey(DEV_LICENSES.demo);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-md w-full">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-600/20">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Activate Your License
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Enter your ThemeForest license key to unlock database configuration
          </p>
        </div>

        {/* License Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="license"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                License Key
              </label>
              <input
                id="license"
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-center text-lg tracking-wider"
                maxLength={23}
                disabled={isValidating}
              />
              <p className="text-xs text-slate-500 mt-2">
                Find your license key in your ThemeForest purchase email
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {isValidating && !error && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  License validated! Redirecting...
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isValidating || !licenseKey}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isValidating ? (
                "Validating..."
              ) : (
                <>
                  Activate License
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Development Mode Helpers */}
          {showDevKeys && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 mb-3">
                Development Mode Only
              </p>
              <button
                onClick={useDemoLicense}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Use Demo License
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Don't have a license?{" "}
            <a
              href="https://themeforest.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Purchase on ThemeForest
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
