"use client";

import { useState, useEffect, useCallback } from "react";
import { shouldUseDatabaseData } from "@/lib/dataSource";

/**
 * Reactive hook for data mode detection
 */
export function useDataMode() {
  const [isDatabase, setIsDatabase] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setIsDatabase(shouldUseDatabaseData());
  }, []);

  useEffect(() => {
    setMounted(true);
    // Initial sync
    setIsDatabase(shouldUseDatabaseData());

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
