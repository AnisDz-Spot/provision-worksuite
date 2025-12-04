"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function DatabaseSetupPage() {
  const router = useRouter();
  const [postgresUrl, setPostgresUrl] = useState("");
  const [blobToken, setBlobToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const isTestSuccessful = !!testResult?.success;

  // Admin DB Setup integration
  const ADMIN_SETUP_URL = "http://localhost:4000/api/admin/setup-db"; // Change to your server's URL in production
  const [adminSetupLoading, setAdminSetupLoading] = useState(false);
  const [adminSetupResult, setAdminSetupResult] = useState<string | null>(null);

  const handleAdminSetup = async () => {
    setAdminSetupLoading(true);
    setAdminSetupResult(null);
    try {
      const resp = await fetch(ADMIN_SETUP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseUrl: postgresUrl,
          secret: "changeme", // Use your real secret!
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setAdminSetupResult("✅ Database setup completed!");
      } else {
        setAdminSetupResult(`❌ Setup failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      setAdminSetupResult("❌ Network or server error");
    } finally {
      setAdminSetupLoading(false);
    }
  };

  useEffect(() => {
    // Load existing config if any
    const config = localStorage.getItem("pv:dbConfig");
    if (config) {
      try {
        const parsed = JSON.parse(config);
        setPostgresUrl(parsed.postgresUrl || "");
        setBlobToken(parsed.blobToken || "");
      } catch {}
    }
  }, []);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Save temporarily to test
      const config = {
        postgresUrl,
        blobToken,
        configured: true,
        configuredAt: new Date().toISOString(),
      };
      localStorage.setItem("pv:dbConfig", JSON.stringify(config));

      // Test database connection
      const response = await fetch("/api/test-db");
      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: "✅ Database connection successful!",
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Database connection failed: ${data.error}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `❌ Error testing connection: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!postgresUrl || !blobToken) {
      alert("Please fill in all fields");
      return;
    }

    if (!isTestSuccessful) {
      alert(
        "Please test the connection and ensure it is successful before saving."
      );
      return;
    }

    setLoading(true);

    try {
      // Save configuration
      const config = {
        postgresUrl,
        blobToken,
        configured: true,
        configuredAt: new Date().toISOString(),
      };
      localStorage.setItem("pv:dbConfig", JSON.stringify(config));

      // Mark setup step as complete
      const setupStatus = {
        databaseConfigured: true,
        profileCompleted: false,
      };
      localStorage.setItem("pv:setupStatus", JSON.stringify(setupStatus));

      // Call API to auto-create tables (prisma db push)
      const resp = await fetch("/api/setup-db", { method: "POST" });
      const result = await resp.json();
      if (!result.success) {
        alert(
          "Database credentials saved, but failed to create tables: " +
            (result.error || "Unknown error")
        );
        setLoading(false);
        return;
      }

      // Redirect to profile setup
      router.push("/settings?tab=profile&setup=true");
    } catch (error) {
      alert("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Configuration</h1>
        <p className="text-muted-foreground">
          Configure your database and storage connections. This is a one-time
          setup required before using the app.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Config Form */}
        <Card className="p-6 flex-1 min-w-0">
          <div className="space-y-6">
            {/* Postgres URL */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                PostgreSQL Connection URL
              </label>
              <p className="text-sm text-muted-foreground mb-3">
                Get this from your Vercel Storage → Postgres → .env.local tab.
                Copy the{" "}
                <code className="bg-accent px-1 py-0.5 rounded">
                  POSTGRES_URL
                </code>{" "}
                value.
              </p>
              <Input
                type="text"
                placeholder="postgres://default:xxxxx@xxxx.neon.tech:5432/verceldb"
                value={postgresUrl}
                onChange={(e) => setPostgresUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Blob Token */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Blob Storage Token
              </label>
              <p className="text-sm text-muted-foreground mb-3">
                Get this from your Vercel Storage → Blob → .env.local tab. Copy
                the{" "}
                <code className="bg-accent px-1 py-0.5 rounded">
                  BLOB_READ_WRITE_TOKEN
                </code>{" "}
                value.
              </p>
              <Input
                type="password"
                placeholder="vercel_blob_rw_xxxxx"
                value={blobToken}
                onChange={(e) => setBlobToken(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-4 rounded-lg ${
                  testResult.success
                    ? "bg-green-500/10 border border-green-500"
                    : "bg-red-500/10 border border-red-500"
                }`}
              >
                <p className="text-sm">{testResult.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={testConnection}
                disabled={!postgresUrl || !blobToken || testing}
                variant="outline"
              >
                {testing ? "Testing..." : "Test Connection"}
              </Button>

              <Button
                onClick={handleSave}
                disabled={
                  !postgresUrl || !blobToken || loading || !isTestSuccessful
                }
                variant="primary"
                title={
                  !isTestSuccessful
                    ? "Please test connection successfully first"
                    : undefined
                }
              >
                {loading ? "Saving..." : "Save & Continue to Profile Setup"}
              </Button>

              {/* Admin DB Setup Button */}
              <Button
                onClick={handleAdminSetup}
                disabled={!postgresUrl || adminSetupLoading}
                variant="secondary"
              >
                {adminSetupLoading ? "Setting up..." : "Run Admin DB Setup"}
              </Button>
              {adminSetupResult && (
                <div className="mt-2 text-sm">{adminSetupResult}</div>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions Card */}
        <Card className="p-6 flex-1 min-w-0 bg-accent/20">
          <h3 className="text-lg font-semibold mb-3">📋 Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Go to your Vercel project dashboard → <strong>Storage</strong> tab
            </li>
            <li>
              Create a <strong>Postgres</strong> database if you haven't already
            </li>
            <li>
              Create a <strong>Blob</strong> storage if you haven't already
            </li>
            <li>
              Click on each storage → <strong>.env.local</strong> tab
            </li>
            <li>Copy the connection strings and paste them above</li>
            <li>
              Click <strong>Test Connection</strong> to verify
            </li>
            <li>
              Click <strong>Save & Continue</strong> to proceed to profile setup
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
