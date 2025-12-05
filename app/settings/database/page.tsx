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

  // DB type selector
  const [dbType, setDbType] = useState<string>("");
  const dbTypes = [
    {
      key: "sql",
      label: "SQL Database",
      icon: "🗄️",
      example: "PostgreSQL, MySQL, MariaDB, SQL Server, SQLite",
      hint: "Structured, relational databases. Use for most business data."
    },
    {
      key: "nosql",
      label: "NoSQL Database",
      icon: "📦",
      example: "MongoDB, DynamoDB, Firebase",
      hint: "Flexible, document or key-value stores. Use for unstructured or rapidly changing data."
    },
    {
      key: "cloud",
      label: "Cloud Database",
      icon: "☁️",
      example: "AWS RDS, Azure SQL, Google Cloud SQL, MongoDB Atlas",
      hint: "Managed databases hosted in the cloud."
    },
    {
      key: "object",
      label: "Object-Oriented Database",
      icon: "🧩",
      example: "db4o, ObjectDB",
      hint: "Store data as objects, ideal for complex data models."
    },
  ];

  // Admin DB Setup integration
  const ADMIN_SETUP_URL = "http://localhost:4000/api/admin/setup-db"; // Change to your server's URL in production
  const [adminSetupLoading, setAdminSetupLoading] = useState(false);
  const [adminSetupResult, setAdminSetupResult] = useState<string | null>(null);

  // License check state
  const [license, setLicense] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseValid, setLicenseValid] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  const handleCheckLicense = async () => {
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
      } else {
        setLicenseError(data.error || "Invalid serial number");
        setLicenseValid(false);
      }
    } catch (err) {
      setLicenseError("Network or server error");
      setLicenseValid(false);
    } finally {
      setLicenseLoading(false);
    }
  };
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
        setAdminSetupResult(
          `❌ Setup failed: ${data.error || "Unknown error"}`
        );
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
        <h1 className="text-3xl font-bold mb-2">License Activation</h1>
        <p className="text-muted-foreground">
          Enter your serial number to activate your app. You must activate
          before configuring your database.
        </p>
      </div>

      {/* License check form */}
      {!licenseValid && (
        <Card className="p-6 max-w-md mx-auto mb-8">
          <div className="space-y-4">
            <label className="block text-sm font-semibold mb-2">
              Serial Number
            </label>
            <Input
              type="text"
              placeholder="Enter your serial number"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCheckLicense}
              disabled={!license || licenseLoading}
              variant="primary"
            >
              {licenseLoading ? "Checking..." : "Check License"}
            </Button>
            {licenseError && (
              <div className="text-red-500 text-sm mt-2">{licenseError}</div>
            )}
          </div>
        </Card>
      )}

      {/* Show DB type selector and config only if license is valid */}
      {licenseValid && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Database Type</h1>
            <p className="text-muted-foreground mb-4">
              Select the type of database you want to use. Not sure? Hover each option for a quick example.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              {dbTypes.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  className={`border rounded-lg px-4 py-3 flex flex-col items-center justify-center min-w-[200px] min-h-[170px] max-w-[200px] max-h-[170px] cursor-pointer transition-all duration-150 ${dbType === type.key ? "border-blue-500 bg-blue-50 dark:bg-blue-900" : "border-gray-300 bg-white dark:bg-gray-800 hover:border-blue-400"}`}
                  style={{ flex: "1 1 200px" }}
                  title={type.hint}
                  onClick={() => setDbType(type.key)}
                >
                  <span className="text-3xl mb-2">{type.icon}</span>
                  <span className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{type.label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-300 text-center">{type.example}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Show config form only after DB type is selected */}
          {dbType && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Database Configuration</h1>
                <p className="text-muted-foreground">
                  Configure your database and storage connections. This is a one-time setup required before using the app.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Config Form - for now, show SQL fields as before. Later, make dynamic per dbType. */}
                <Card className="p-6 flex-1 min-w-0">
                  <div className="space-y-6">
                    {/* Postgres URL (for SQL) */}
                    {dbType === "sql" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          SQL Connection URL
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example: <code className="bg-accent px-1 py-0.5 rounded">postgres://user:pass@host:5432/db</code>
                        </p>
                        <Input
                          type="text"
                          placeholder="postgres://user:pass@host:5432/db"
                          value={postgresUrl}
                          onChange={(e) => setPostgresUrl(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    {/* NoSQL Example (MongoDB) */}
                    {dbType === "nosql" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          NoSQL Connection URI
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example: <code className="bg-accent px-1 py-0.5 rounded">mongodb+srv://user:pass@cluster.mongodb.net/db</code>
                        </p>
                        <Input
                          type="text"
                          placeholder="mongodb+srv://user:pass@cluster.mongodb.net/db"
                          value={postgresUrl}
                          onChange={(e) => setPostgresUrl(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    {/* Cloud DB Example */}
                    {dbType === "cloud" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Cloud DB Connection URL
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example: <code className="bg-accent px-1 py-0.5 rounded">postgres://user:pass@aws-rds.amazonaws.com:5432/db</code>
                        </p>
                        <Input
                          type="text"
                          placeholder="postgres://user:pass@aws-rds.amazonaws.com:5432/db"
                          value={postgresUrl}
                          onChange={(e) => setPostgresUrl(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    {/* Object-Oriented DB Example */}
                    {dbType === "object" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Object DB Connection String
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example: <code className="bg-accent px-1 py-0.5 rounded">objectdb://user:pass@host:port/db</code>
                        </p>
                        <Input
                          type="text"
                          placeholder="objectdb://user:pass@host:port/db"
                          value={postgresUrl}
                          onChange={(e) => setPostgresUrl(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    {/* Blob Token (optional, shown for all for now) */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Blob Storage Token
                      </label>
                      <p className="text-sm text-muted-foreground mb-3">
                        (Optional) For file uploads. Example: <code className="bg-accent px-1 py-0.5 rounded">vercel_blob_rw_xxxxx</code>
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
                        onClick={async () => {
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
                                message: "✅ Database connection successful! Initializing database...",
                              });
                              // Auto-initialize DB (create tables)
                              const initResp = await fetch("/api/setup-db", { method: "POST" });
                              const initResult = await initResp.json();
                              if (!initResult.success) {
                                setTestResult({
                                  success: false,
                                  message: `❌ Database initialization failed: ${initResult.error || "Unknown error"}`,
                                });
                              } else {
                                setTestResult({
                                  success: true,
                                  message: "✅ Database connection and initialization successful!",
                                });
                              }
                            } else {
                              setTestResult({
                                success: false,
                                message: `❌ Database connection failed: ${data.error}`,
                              });
                            }
                          } catch (error) {
                            setTestResult({
                              success: false,
                              message: `❌ Error testing/initializing DB: ${error instanceof Error ? error.message : "Unknown error"}`,
                            });
                          } finally {
                            setTesting(false);
                          }
                        }}
                        disabled={!postgresUrl || testing}
                        variant="outline"
                      >
                        {testing ? "Testing..." : "Test & Initialize"}
                      </Button>

                      <Button
                        onClick={handleSave}
                        disabled={
                          !postgresUrl || loading || !isTestSuccessful
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
                    </div>
                  </div>
                </Card>

                {/* Instructions Card */}
                <Card className="p-6 flex-1 min-w-0 bg-accent/20">
                  <h3 className="text-lg font-semibold mb-3">
                    📋 Setup Instructions
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Select your database type above</li>
                    <li>Enter your connection string</li>
                    <li>Click <strong>Test Connection</strong> to verify</li>
                    <li>Click <strong>Save & Continue</strong> to proceed to profile setup</li>
                  </ol>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
