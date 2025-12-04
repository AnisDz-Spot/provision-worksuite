// Utility functions to check database configuration status

export function isDatabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const dbConfig = localStorage.getItem("pv:dbConfig");
    if (!dbConfig) return false;

    const config = JSON.parse(dbConfig);
    return !!(config.configured && config.postgresUrl && config.blobToken);
  } catch {
    return false;
  }
}

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

export function getSetupStatus() {
  return {
    isDatabaseConfigured: isDatabaseConfigured(),
    isSetupComplete: isSetupComplete(),
  };
}
