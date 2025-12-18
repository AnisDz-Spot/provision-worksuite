/**
 * Database configuration check utility
 * SECURITY: Uses server-side only checks. Does NOT store credentials in localStorage.
 */

/**
 * Check if database is configured by verifying environment variables on the server
 * This function should only be used on the server side
 */
export function isDatabaseConfiguredServer(): boolean {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return !!dbUrl;
}

/**
 * Client-side check for database configuration status
 * This should call an API endpoint rather than checking localStorage for credentials
 */
export function getDatabaseStatus(): Promise<{
  configured: boolean;
  hasTables: boolean;
}> {
  if (typeof window === "undefined") {
    return Promise.resolve({ configured: false, hasTables: false });
  }

  // Call API endpoint to check status (server-side validation only)
  return fetch("/api/setup/check-system")
    .then((res) => res.json())
    .then((data) => ({
      configured: !!data.dbConfigured,
      hasTables: !!data.hasTables,
    }))
    .catch(() => ({ configured: false, hasTables: false }));
}

export function isDatabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const setupStatus = localStorage.getItem("pv:setupStatus");
    if (!setupStatus) return false;

    const status = JSON.parse(setupStatus);
    // Connection is configured if databaseConfigured is true
    return !!status.databaseConfigured;
  } catch {
    return false;
  }
}

/**
 * Client-side check if database tables exist
 */
export function hasDatabaseTables(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const setupStatus = localStorage.getItem("pv:setupStatus");
    if (!setupStatus) return false;

    const status = JSON.parse(setupStatus);
    return !!status.hasTables;
  } catch {
    return false;
  }
}

/**
 * Client-side setup completion check
 * Only stores non-sensitive setup state flags, not credentials
 */
export function isSetupComplete(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const setupStatus = localStorage.getItem("pv:setupStatus");
    if (!setupStatus) return false;

    const status = JSON.parse(setupStatus);
    return !!(status.databaseConfigured && status.profileCompleted);
  } catch {
    return false;
  }
}

export function markSetupComplete(
  databaseConfigured: boolean,
  profileCompleted: boolean,
  hasTables: boolean = false
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      "pv:setupStatus",
      JSON.stringify({ databaseConfigured, profileCompleted, hasTables })
    );
  } catch {
    console.error("Failed to save setup status");
  }
}

/**
 * Get setup status
 */
export function getSetupStatus() {
  return {
    isSetupComplete: isSetupComplete(),
  };
}
