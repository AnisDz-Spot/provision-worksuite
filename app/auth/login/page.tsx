"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { shouldUseMockData } from "@/lib/dataSource";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [setupComplete, setSetupComplete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("setup") === "complete") {
      setSetupComplete(true);
      window.history.replaceState({}, "", "/auth/login");
    }
  }, [searchParams]);

  const [show2FAInput, setShow2FAInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // If we're already showing 2FA, include the code
    const credentials: any = { email, password };
    if (show2FAInput) {
      credentials.code = twoFactorCode.replace(/\s/g, ""); // Remove spaces
      credentials.useBackupCode = useBackupCode;

      if (!credentials.code) {
        setError("Please enter your authentication code");
        setLoading(false);
        return;
      }
    }

    try {
      const result = await login(
        credentials.email,
        credentials.password,
        credentials.code,
        credentials.useBackupCode
      );

      // Check if server asks for 2FA
      if (result.requires2FA) {
        setShow2FAInput(true);
        setLoading(false);
        // Don't show success yet, wait for code input
        return;
      }

      if (result.success) {
        // Use full page reload to ensure cookies are fresh
        window.location.href = "/";
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }

    setLoading(false);
  };

  const fillDemoCredentials = () => {
    setEmail("admin@provision.com");
    setPassword("password123578951");
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-10 md:p-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to ProVision
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Enter your credentials to continue
          </p>
        </div>

        {/* Demo Mode Alert */}
        {mounted && shouldUseMockData() && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Demo Mode Active
                </span>
              </div>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded transition-colors"
              >
                Autofill
              </button>
            </div>
          </div>
        )}

        {/* Setup Complete Alert */}
        {setupComplete && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-green-800 dark:text-green-200">
                Setup complete! Please sign in with your credentials.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Social Login */}
        <div className="space-y-4 mb-6">
          <SocialLoginButtons />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* 2FA Input (Conditional) */}
          {show2FAInput && (
            <div className="pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="2fa-code"
                  className="block text-base font-medium text-gray-700 dark:text-gray-300"
                >
                  Authentication Code
                </label>
                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {useBackupCode ? "Use Authenticator App" : "Use Backup Code"}
                </button>
              </div>
              <input
                id="2fa-code"
                type="text"
                autoFocus
                required
                maxLength={useBackupCode ? undefined : 6}
                placeholder={useBackupCode ? "XXXX-XXXX" : "000000"}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
                className="w-full px-4 py-3 text-center text-lg tracking-widest font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <p className="mt-2 text-xs text-center text-gray-500">
                {useBackupCode
                  ? "Enter one of your saved backup codes."
                  : "Enter the code from your authenticator app."}
              </p>
            </div>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-8 py-3 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Setup Credentials */}
        {mounted && !shouldUseMockData() && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
              First-time setup credentials
            </p>
            <p className="text-xs font-mono text-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 py-2 px-3 rounded">
              admin@provision.com / password123578951
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-xl mx-auto bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-8 sm:p-10 md:p-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <svg
                className="animate-spin w-8 h-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
