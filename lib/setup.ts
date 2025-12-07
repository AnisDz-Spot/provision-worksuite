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
export function getDatabaseStatus(): Promise<{ configured: boolean }> {
  if (typeof window === "undefined") {
    return Promise.resolve({ configured: false });
  }

  // Call API endpoint to check status (server-side validation only)
  return fetch("/api/db-status")
    .then((res) => res.json())
    .catch(() => ({ configured: false }));
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

/**
 * Mark setup as complete (client-side state only)
 */
export function markSetupComplete(
  databaseConfigured: boolean,
  profileCompleted: boolean
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      "pv:setupStatus",
      JSON.stringify({ databaseConfigured, profileCompleted })
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
