// Data source utilities - determines whether to use database or mock data

import { isDatabaseConfigured } from "./setup";

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
  const pref = readDataModePreference();
  if (pref === "mock") return false;
  if (pref === "real") return true;
  // Default: DB if configured
  return isDatabaseConfigured();
}

export function shouldUseMockData(): boolean {
  const pref = readDataModePreference();
  if (pref === "mock") return true;
  if (pref === "real") return false;
  return !isDatabaseConfigured();
}

// Helper to get data source indicator for debugging
export function getDataSource(): "database" | "mock" {
  return shouldUseDatabaseData() ? "database" : "mock";
}
