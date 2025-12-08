// lib/config/auto-setup.ts
/**
 * Automatic Configuration System
 * Handles setup for ANY hosting provider without manual intervention
 */

import { encrypt, decrypt } from "./encryption";
import {
  saveSetting,
  getSetting,
  checkTablesExist,
  executeSql,
} from "./settings-db";
import fs from "fs";
import path from "path";

export type ConfigMode = "auto" | "manual";
export type AppMode = "development" | "production";

interface DatabaseConfig {
  postgresUrl: string;
  blobToken: string;
  mode: AppMode;
  source: "database" | "environment" | "none";
}

/**
 * Smart configuration loader
 * Priority: Database > Environment Variables > Setup Required
 */
export async function getConfig(): Promise<DatabaseConfig> {
  try {
    // 1. Check if user has configured custom credentials in database
    const customDbUrl = await getSetting("db_connection_string");
    const customBlobToken = await getSetting("blob_storage_token");

    if (customDbUrl && customBlobToken) {
      console.log("✅ Using database-stored credentials (user-configured)");
      return {
        postgresUrl: customDbUrl,
        blobToken: customBlobToken,
        mode: "production",
        source: "database",
      };
    }
  } catch (error) {
    console.log(
      "ℹ️ Database settings not available yet (expected on first run)"
    );
  }

  // 2. Check environment variables (platform-provided or .env)
  const envDbUrl = process.env.POSTGRES_URL;
  const envBlobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (envDbUrl && envBlobToken) {
    console.log("✅ Using environment variables (platform-configured)");
    return {
      postgresUrl: envDbUrl,
      blobToken: envBlobToken,
      mode:
        process.env.NODE_ENV === "production" ? "production" : "development",
      source: "environment",
    };
  }

  // 3. No configuration found - setup required
  console.log("⚠️ No configuration found - setup wizard required");
  return {
    postgresUrl: "",
    blobToken: "",
    mode: "development",
    source: "none",
  };
}

/**
 * Check if initial setup is complete
 */
export async function isSetupComplete(): Promise<boolean> {
  try {
    // Also check if tables exist to determine if setup is truly "complete" from an app perspective
    const setupFlag = await getSetting("setup_completed");
    if (setupFlag === "true") return true;

    // Fallback: If tables exist and Env vars are present, we might consider it 'setup enough'
    // BUT we want explicit opt-in. So returning strict check for now.
    return false;
  } catch {
    return false;
  }
}

/**
 * Save user-provided credentials (from setup wizard or settings page)
 */
export async function saveCustomCredentials(
  postgresUrl: string,
  blobToken: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate connections first
    const dbTest = await testDatabaseConnection(postgresUrl);
    if (!dbTest.success) {
      return { success: false, message: `Database: ${dbTest.message}` };
    }

    const blobTest = await testBlobConnection(blobToken);
    if (!blobTest.success) {
      return { success: false, message: `Blob Storage: ${blobTest.message}` };
    }

    // Encrypt and save
    await saveSetting("db_connection_string", postgresUrl, true);
    await saveSetting("blob_storage_token", blobToken, true);
    await saveSetting("setup_completed", "true", false);
    await saveSetting("configured_by", userId, false);
    await saveSetting("configured_at", new Date().toISOString(), false);

    return { success: true, message: "Credentials saved successfully" };
  } catch (error) {
    return {
      success: false,
      message: `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Reset to environment variables (useful for development/testing)
 */
export async function resetToEnvironmentConfig(): Promise<void> {
  await saveSetting("db_connection_string", "", true);
  await saveSetting("blob_storage_token", "", true);
  await saveSetting("setup_completed", "false", false);
}

/**
 * Test database connection
 */
async function testDatabaseConnection(connectionString: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { Client } = require("pg");
    const client = new Client({ connectionString });

    await client.connect();
    const result = await client.query("SELECT NOW()");
    await client.end();

    return {
      success: true,
      message: `Connected successfully at ${result.rows[0].now}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Test Blob storage connection
 */
async function testBlobConnection(token: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Simple test: try to list with the token
    const response = await fetch("https://blob.vercel-storage.com", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok || response.status === 404) {
      // 404 is OK - means token is valid but no files yet
      return { success: true, message: "Token validated successfully" };
    }

    return {
      success: false,
      message: `Invalid token: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Initialize Database Schema from SQL file
 */
export async function initializeDatabaseSchema(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
    if (!fs.existsSync(schemaPath)) {
      return { success: false, message: "Schema file not found" };
    }

    const sqlContent = fs.readFileSync(schemaPath, "utf8");

    // Execute the entire SQL script
    // Note: pg driver (and executeSql helper) handles multiple statements if they are valid SQL
    await executeSql(sqlContent);

    // Mark setup as complete if successful
    await saveSetting("setup_completed", "true", false);

    return { success: true, message: "Database initialized successfully" };
  } catch (error: any) {
    console.error("Schema initialization failed:", error);
    return {
      success: false,
      message: `Initialization failed: ${error.message}`,
    };
  }
}

/**
 * Get current configuration status for UI display
 */
export async function getConfigStatus(): Promise<{
  hasEnvironmentVars: boolean;
  hasDatabaseConfig: boolean;
  isSetupComplete: boolean;
  hasTables: boolean;
  currentSource: "database" | "environment" | "none";
  recommendations: string[];
}> {
  const hasEnvVars = !!(
    process.env.POSTGRES_URL && process.env.BLOB_READ_WRITE_TOKEN
  );

  let hasDatabaseConfig = false;
  let setupComplete = false;
  let hasTables = false;

  try {
    const dbUrl = await getSetting("db_connection_string");
    hasDatabaseConfig = !!dbUrl;
    setupComplete = await isSetupComplete();
    hasTables = await checkTablesExist();
  } catch (e) {
    // Database not accessible yet
    // hasTables stays false
  }

  const config = await getConfig();
  const recommendations: string[] = [];

  if (config.source === "none") {
    recommendations.push(
      "⚠️ No configuration found. Please complete setup wizard."
    );
  } else if (config.source === "environment" && !hasDatabaseConfig) {
    recommendations.push(
      "ℹ️ Currently using environment variables. You can configure custom credentials in Settings."
    );
  } else if (config.source === "database") {
    recommendations.push(
      "✅ Using custom database credentials. You can change them in Settings."
    );
  }

  if (
    (config.source === "environment" || config.source === "database") &&
    !hasTables
  ) {
    recommendations.push(
      "⚠️ Database tables appear to be missing. Initialization required."
    );
  }

  return {
    hasEnvironmentVars: hasEnvVars,
    hasDatabaseConfig,
    isSetupComplete: setupComplete,
    hasTables,
    currentSource: config.source,
    recommendations,
  };
}
