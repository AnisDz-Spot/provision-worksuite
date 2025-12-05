"use client";

import { useState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function DatabaseSetupPage() {
  // For copy-to-clipboard
  const commandRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const handleCopyCommand = () => {
    if (commandRef.current) {
      commandRef.current.select();
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  const router = useRouter();
  const [postgresUrl, setPostgresUrl] = useState("");
  const [blobToken, setBlobToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const isConnectionTested = !!testResult?.success;

  const [dbType, setDbType] = useState<string>("");
  const dbTypes = [
    {
      key: "sql",
      label: "SQL Database",
      icon: "🗄️",
      example: "PostgreSQL, MySQL, MariaDB, SQL Server, SQLite",
      hint: "Structured, relational databases. Use for most business data.",
    },
    {
      key: "nosql",
      label: "NoSQL Database",
      icon: "📦",
      example: "MongoDB, DynamoDB, Firebase",
      hint: "Flexible, document or key-value stores. Use for unstructured or rapidly changing data.",
    },
    {
      key: "cloud",
      label: "Cloud Database",
      icon: "☁️",
      example: "AWS RDS, Azure SQL, Google Cloud SQL, MongoDB Atlas",
      hint: "Managed databases hosted in the cloud.",
    },
    {
      key: "object",
      label: "Object-Oriented Database",
      icon: "🧩",
      example: "db4o, ObjectDB",
      hint: "Store data as objects, ideal for complex data models.",
    },
  ];

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

  useEffect(() => {
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
        configured: false, // Not fully configured yet
        configuredAt: new Date().toISOString(),
      };
      localStorage.setItem("pv:dbConfig", JSON.stringify(config));

      // Test basic database connection (not table queries)
      const response = await fetch("/api/test-db-connection");
      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: "✅ Database connection successful! Ready to initialize.",
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
    if (!postgresUrl) {
      alert("Please enter a database connection string");
      return;
    }

    if (!isConnectionTested) {
      alert("Please test the connection first");
      return;
    }

    setLoading(true);

    try {
      // Save final configuration
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

      {licenseValid && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Database Type</h1>
            <p className="text-muted-foreground mb-4">
              Select the type of database you want to use. Not sure? Hover each
              option for a quick example.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 w-full">
              {dbTypes.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  className={`border rounded-lg px-4 py-3 flex flex-col items-center justify-center w-full h-full min-h-[170px] cursor-pointer transition-all duration-150 ${
                    dbType === type.key
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                      : "border-gray-300 bg-white dark:bg-gray-800 hover:border-blue-400"
                  }`}
                  title={type.hint}
                  onClick={() => setDbType(type.key)}
                >
                  <span className="text-3xl mb-2">{type.icon}</span>
                  <span className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
                    {type.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-300 text-center">
                    {type.example}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {dbType && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Database Configuration
                </h1>
                <p className="text-muted-foreground">
                  Configure your database connection. Follow the steps below to
                  complete setup.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Card className="p-6 flex-1 min-w-0">
                  <div className="space-y-6">
                    {dbType === "sql" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          SQL Connection URL
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example:{" "}
                          <code className="bg-accent px-1 py-0.5 rounded">
                            postgres://user:pass@host:5432/db
                          </code>
                        </p>
                        <Input
                          type="text"
                          placeholder="postgres://user:pass@host:5432/db"
                          value={postgresUrl}
                          onChange={(e) => {
                            setPostgresUrl(e.target.value);
                            setTestResult(null);
                          }}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    {dbType === "nosql" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          NoSQL Connection URI
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example:{" "}
                          <code className="bg-accent px-1 py-0.5 rounded">
                            mongodb+srv://user:pass@cluster.mongodb.net/db
                          </code>
                        </p>
                        <Input
                          type="text"
                          placeholder="mongodb+srv://user:pass@cluster.mongodb.net/db"
                          value={postgresUrl}
                          onChange={(e) => {
                            setPostgresUrl(e.target.value);
                            setTestResult(null);
                          }}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    {dbType === "cloud" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Cloud DB Connection URL
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example:{" "}
                          <code className="bg-accent px-1 py-0.5 rounded">
                            postgres://user:pass@aws-rds.amazonaws.com:5432/db
                          </code>
                        </p>
                        <Input
                          type="text"
                          placeholder="postgres://user:pass@aws-rds.amazonaws.com:5432/db"
                          value={postgresUrl}
                          onChange={(e) => {
                            setPostgresUrl(e.target.value);
                            setTestResult(null);
                          }}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
                    {dbType === "object" && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Object DB Connection String
                        </label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Example:{" "}
                          <code className="bg-accent px-1 py-0.5 rounded">
                            objectdb://user:pass@host:port/db
                          </code>
                        </p>
                        <Input
                          type="text"
                          placeholder="objectdb://user:pass@host:port/db"
                          value={postgresUrl}
                          onChange={(e) => {
                            setPostgresUrl(e.target.value);
                            setTestResult(null);
                          }}
                          className="font-mono text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Blob Storage Token
                      </label>
                      <p className="text-sm text-muted-foreground mb-3">
                        (Optional) For file uploads. Example:{" "}
                        <code className="bg-accent px-1 py-0.5 rounded">
                          vercel_blob_rw_xxxxx
                        </code>
                      </p>
                      <Input
                        type="password"
                        placeholder="vercel_blob_rw_xxxxx"
                        value={blobToken}
                        onChange={(e) => setBlobToken(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>

                    {testResult && (
                      <div
                        className={`p-4 rounded-lg ${
                          testResult.success
                            ? "bg-green-500/10 border border-green-500"
                            : "bg-red-500/10 border border-red-500"
                        }`}
                      >
                        <p className="text-sm flex items-center gap-2">
                          {testResult.success ? (
                            <span className="inline-flex items-center text-green-600 font-semibold">
                              <span className="mr-1">✔</span>{" "}
                              {testResult.message}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600 font-semibold">
                              <span className="mr-1">✖</span>{" "}
                              {testResult.message}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                      <div className="flex gap-3">
                        <Button
                          onClick={testConnection}
                          disabled={!postgresUrl || testing}
                          variant="outline"
                          className="flex-1"
                        >
                          {testing ? "Testing..." : "1. Test Connection"}
                        </Button>
                      </div>

                      <Button
                        onClick={handleSave}
                        disabled={loading || !isConnectionTested}
                        variant="primary"
                        className="w-full"
                      >
                        {loading
                          ? "Saving..."
                          : "2. Save & Continue to Profile"}
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 flex-1 min-w-0 bg-accent/20">
                  <h3 className="text-lg font-semibold mb-3">
                    📋 Setup Instructions
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Select your database type above</li>
                    <li>Enter your connection string</li>
                    <li>
                      Click <strong>Test Connection</strong> to verify
                      connectivity
                    </li>
                    <li>
                      <span className="font-semibold">
                        After a successful connection:
                      </span>
                      <br />
                      <span className="block mt-1">
                        Run this command in your terminal (locally or in your
                        server/CI):
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          ref={commandRef}
                          readOnly
                          value={`DATABASE_URL=${postgresUrl || "your_connection_string"} npx prisma db push`}
                          className="bg-accent px-2 py-1 rounded font-mono text-xs w-full cursor-pointer border border-gray-300"
                          onClick={handleCopyCommand}
                          aria-label="Copy schema push command"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyCommand}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                      <span className="block mt-1 text-xs text-muted-foreground">
                        (Replace <code>your_connection_string</code> with your
                        actual DB URL)
                      </span>
                    </li>
                    <li>
                      Click <strong>Save & Continue</strong> to complete setup
                    </li>
                  </ol>

                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded">
                    <p className="text-xs font-semibold mb-1">💡 Tip</p>
                    <ul className="text-xs list-disc pl-4">
                      <li>
                        For <b>serverless</b> (Vercel, Netlify, etc.): schema
                        setup must be done outside the app.
                      </li>
                      <li>
                        For <b>traditional servers</b>: run the command above
                        during deployment or after DB config.
                      </li>
                      <li>
                        Need help? See the included documentation or contact
                        support.
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
