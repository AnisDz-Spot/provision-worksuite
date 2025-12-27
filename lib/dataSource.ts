// Data source utilities - determines whether to use database or mock data

import { useState, useEffect, useCallback } from "react";
import { isGlobalAdmin } from "./auth-utils";
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
    // Dispatch event for same-tab reactivity
    window.dispatchEvent(new Event("pv:dataModeChanged"));
  } catch {}
}

/**
 * Reactive hook for data mode detection
 */
export function useDataMode() {
  const [isDatabase, setIsDatabase] = useState(shouldUseDatabaseData());
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setIsDatabase(shouldUseDatabaseData());
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "pv:dataMode" || e.key === "pv:currentUser") {
        refresh();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("pv:dataModeChanged", refresh);

    // Also poll slightly for the first few seconds to catch late auth
    const poll = setInterval(refresh, 1000);
    const timeout = setTimeout(() => clearInterval(poll), 5000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pv:dataModeChanged", refresh);
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [refresh]);

  return {
    isDatabase: mounted ? isDatabase : false,
    isMock: mounted ? !isDatabase : true,
    refresh,
  };
}

export function shouldUseDatabaseData(): boolean {
  // Server-side: check environment variables
  if (typeof window === "undefined") {
    return isDatabaseConfiguredServer();
  }

  const pref = readDataModePreference();
  if (pref === "mock") return false;
  if (pref === "real") return true;

  // Global Admin (dummy mode) defaults to mock data unless explicitly overridden
  const userJson =
    typeof window !== "undefined"
      ? localStorage.getItem("pv:currentUser")
      : null;
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (isGlobalAdmin(user)) {
        return false;
      }
    } catch {}
  }

  // Default priority: If setup is complete, default to DB. Otherwise default to mock.
  if (isSetupComplete()) return true;

  return false;
}

export function shouldUseMockData(): boolean {
  return !shouldUseDatabaseData();
}

// Helper to get data source indicator for debugging
export function getDataSource(): "database" | "mock" {
  return shouldUseDatabaseData() ? "database" : "mock";
}
