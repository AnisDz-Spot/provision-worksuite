"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithCsrf } from "@/lib/csrf-client";

const CACHE_KEY_STATS = "pv:dashboard:stats";
const CACHE_KEY_CHARTS = "pv:dashboard:charts";

export function useDashboardData() {
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from cache initially
  useEffect(() => {
    const cachedStats = localStorage.getItem(CACHE_KEY_STATS);
    const cachedCharts = localStorage.getItem(CACHE_KEY_CHARTS);

    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        console.warn("Failed to parse cached stats", e);
      }
    }

    if (cachedCharts) {
      try {
        setCharts(JSON.parse(cachedCharts));
      } catch (e) {
        console.warn("Failed to parse cached charts", e);
      }
    }

    // If we have cache, we are not "strictly" loading anymore
    if (cachedStats && cachedCharts) {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      // Fetch concurrently
      const [statsRes, chartsRes] = await Promise.all([
        fetchWithCsrf("/api/analytics/stats", { cache: "no-store" }),
        fetchWithCsrf("/api/analytics/charts", { cache: "no-store" }),
      ]);

      const [statsData, chartsData] = await Promise.all([
        statsRes.json(),
        chartsRes.json(),
      ]);

      if (statsData.success && statsData.data) {
        setStats(statsData.data);
        localStorage.setItem(CACHE_KEY_STATS, JSON.stringify(statsData.data));
      }

      if (chartsData.success && chartsData.data) {
        setCharts(chartsData.data);
        localStorage.setItem(CACHE_KEY_CHARTS, JSON.stringify(chartsData.data));
      }
    } catch (err: any) {
      console.error("Dashboard refresh failed:", err);
      setError(err.message || "Failed to refresh dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    stats,
    charts,
    loading,
    refreshing,
    error,
    refresh: refreshData,
  };
}
