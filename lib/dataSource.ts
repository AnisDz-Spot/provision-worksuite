// Data source utilities - determines whether to use database or mock data

import {
  isDatabaseConfigured,
  isDatabaseConfiguredServer,
  isSetupComplete,
} from "./setup";

// Optional admin override stored in localStorage: 'real' | 'mock'
function readDataModePreference(): "real" | "mock" | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem("pv:dataMode");
    if (val === "real" || val === "mock") return val;
    return null;
  } catch {
    return null;
  }
}

export function setDataModePreference(mode: "real" | "mock") {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:dataMode", mode);
  } catch {}
}

export function shouldUseDatabaseData(): boolean {
  // Server-side: check environment variables
  if (typeof window === "undefined") {
    return isDatabaseConfiguredServer();
  }

  const pref = readDataModePreference();
  if (pref === "mock") return false;
  if (pref === "real") return true;

  // Default priority: If setup is complete, default to DB. Otherwise default to mock.
  if (isSetupComplete()) return true;

  return false;
}

export function shouldUseMockData(): boolean {
  const pref = readDataModePreference();
  if (pref === "mock") return true;
  if (pref === "real") return false;
  // Default: Use mock data until explicitly chosen otherwise
  return true;
}

// Helper to get data source indicator for debugging
export function getDataSource(): "database" | "mock" {
  return shouldUseDatabaseData() ? "database" : "mock";
}
