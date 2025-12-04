"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
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

  useEffect(() => {
    if (searchParams.get("setup") === "complete") {
      setSetupComplete(true);
      // Clear the URL parameter
      window.history.replaceState({}, "", "/auth/login");
    }
  }, [searchParams]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);

    if (result.success) {
      router.push("/");
    } else {
      setError(result.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md p-10 bg-card border rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-7 text-center">
        Sign In to ProVision
      </h1>
      {shouldUseMockData() && (
        <div className="mb-4 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-800 text-center text-xs">
          Demo Mode is enabled.
          <button
            className="ml-2 underline hover:no-underline"
            onClick={() =>
              navigator.clipboard
                .writeText("admin@provision.com / password1234567890")
                .catch(() => {})
            }
            title="Click to copy demo credentials"
          >
            Copy admin@provision.com / password1234567890
          </button>
        </div>
      )}
      {setupComplete && (
        <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-center text-sm">
          ✅ Setup complete! Please log in with your new credentials.
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-center text-sm">
          {error}
        </div>
      )}
      <form className="flex flex-col gap-6" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="text-sm font-medium cursor-pointer">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoFocus
            required
            className="mt-1 w-full border rounded px-3 py-2 outline-none bg-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium cursor-pointer"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="mt-1 w-full border rounded px-3 py-2 outline-none bg-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      <div className="flex justify-between text-sm mt-6">
        <Link href="/auth/forgot" className="hover:underline cursor-pointer">
          Forgot password?
        </Link>
      </div>
      {!shouldUseMockData() && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>First-time setup credentials:</p>
          <p className="font-mono text-xs mt-1">
            anis@provision.com / password123578951
          </p>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md p-10 bg-card border rounded-xl shadow">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
