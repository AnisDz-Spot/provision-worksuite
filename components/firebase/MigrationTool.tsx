"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { migrateFromLocalStorage, clearFirestoreData } from "@/lib/firestore";
import { useAuth } from "@/components/auth/AuthContext";
import {
  Database,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";

/**
 * Firebase Migration Tool
 *
 * This component helps you migrate your localStorage data to Firestore.
 * Use it once, then remove it from your app.
 *
 * Add this to any page temporarily: <FirebaseMigrationTool />
 */
export function FirebaseMigrationTool() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<
    "idle" | "migrating" | "success" | "error"
  >("idle");
  const [result, setResult] = useState<{
    projects: number;
    tasks: number;
    errors: string[];
  } | null>(null);

  const handleMigrate = async () => {
    if (!currentUser) {
      alert("Please login first");
      return;
    }

    if (
      !confirm(
        "This will migrate all localStorage data to Firestore. Continue?"
      )
    ) {
      return;
    }

    setStatus("migrating");

    try {
      const migrationResult = await migrateFromLocalStorage(currentUser.id);
      setResult(migrationResult);
      setStatus("success");
    } catch (error) {
      console.error("Migration failed:", error);
      setStatus("error");
      setResult({ projects: 0, tasks: 0, errors: [String(error)] });
    }
  };

  const handleClear = async () => {
    if (
      !confirm(
        "⚠️ WARNING: This will DELETE ALL data from Firestore. Are you sure?"
      )
    ) {
      return;
    }

    if (
      !confirm(
        "This action cannot be undone. Type YES in the next prompt to confirm."
      )
    ) {
      return;
    }

    const confirmation = prompt("Type YES to confirm deletion:");
    if (confirmation !== "YES") {
      alert("Cancelled");
      return;
    }

    setStatus("migrating");

    try {
      await clearFirestoreData();
      setStatus("success");
      alert("All Firestore data has been cleared");
    } catch (error) {
      console.error("Clear failed:", error);
      setStatus("error");
      alert("Failed to clear data: " + error);
    }
  };

  const checkLocalStorageData = () => {
    const projects = localStorage.getItem("pv:projects");
    const tasks = localStorage.getItem("pv:tasks");

    const projectCount = projects ? JSON.parse(projects).length : 0;
    const taskCount = tasks ? JSON.parse(tasks).length : 0;

    alert(
      `LocalStorage Data:\n\nProjects: ${projectCount}\nTasks: ${taskCount}`
    );
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto my-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Firebase Migration Tool</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>⚠️ Important:</strong> This tool migrates your localStorage
            data to Firebase Firestore. Run it once after setting up Firebase,
            then remove this component from your app.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={checkLocalStorageData}
            variant="outline"
            className="w-full"
          >
            <Database className="w-4 h-4 mr-2" />
            Check LocalStorage Data
          </Button>

          <Button
            onClick={handleMigrate}
            disabled={status === "migrating"}
            className="w-full"
          >
            {status === "migrating" ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Migrate to Firestore
              </>
            )}
          </Button>

          <Button
            onClick={handleClear}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Firestore Data (Danger!)
          </Button>
        </div>

        {status === "success" && result && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Migration Successful!
                </h3>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>✓ Migrated {result.projects} projects</li>
                  <li>✓ Migrated {result.tasks} tasks</li>
                </ul>
                {result.errors.length > 0 && (
                  <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-semibold">Warnings:</p>
                    <ul className="list-disc list-inside">
                      {result.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                  Migration Failed
                </h3>
                {result?.errors && result.errors.length > 0 && (
                  <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t">
        <h3 className="text-sm font-semibold mb-2">Next Steps:</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Verify your data in Firebase Console</li>
          <li>Test the app with Firestore data</li>
          <li>Remove this component from your app</li>
          <li>Deploy your app to production</li>
        </ol>
      </div>
    </Card>
  );
}
