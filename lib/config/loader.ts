import { getSetting } from "./settings-db";

export type SystemConfig = {
  postgresUrl: string | undefined;
  blobToken: string | undefined;
  mode: "real" | "mock";
  isConfigured: boolean;
};

// Cache config in memory to avoid repeated DB hits/decryption per request
// In serverless, this persists for the warm container duration
let cachedConfig: SystemConfig | null = null;
const CACHE_TTL_MS = 60000; // 1 minute cache
let lastCacheTime = 0;

export async function getSystemConfig(): Promise<SystemConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedConfig;
  }

  // Default to env vars (fallback/bootstrap)
  const config: SystemConfig = {
    postgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL,
    blobToken: process.env.BLOB_READ_WRITE_TOKEN,
    // Determine mode from persistent setting or env
    mode: (process.env.NEXT_PUBLIC_DATA_MODE as "real" | "mock") || "real",
    isConfigured: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
  };

  try {
    // 1. Check if we have a stored configuration in DB
    // This requires the bootstrap connection (env vars) to be valid
    const dbPostgresUrl = await getSetting("db_connection_string");
    const dbBlobToken = await getSetting("blob_storage_token");
    const dbAppMode = await getSetting("app_mode");

    // 2. Priority: DB Settings > Env Vars
    if (dbPostgresUrl) {
      config.postgresUrl = dbPostgresUrl;
      config.isConfigured = true;
    }

    if (dbBlobToken) {
      config.blobToken = dbBlobToken;
    }

    if (dbAppMode) {
      config.mode = dbAppMode as "real" | "mock";
    }

    // Update cache
    cachedConfig = config;
    lastCacheTime = now;
  } catch (error) {
    // If DB connection fails or table doesn't exist, we fallback to env vars exclusively
    // This handles the "Cold Start / First Run" scenario gracefully
    // console.warn("Failed to load settings from DB, using fallback env vars:", error);
  }

  return config;
}

// Helper to force cache refresh (e.g. after saving new settings)
export function invalidateConfigCache() {
  cachedConfig = null;
  lastCacheTime = 0;
}
