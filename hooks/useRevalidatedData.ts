"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Options<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  persistKey?: string;
  revalidateOnMount?: boolean;
  staleTime?: number;
}

export function useRevalidatedData<T>(
  fetchFn: () => Promise<T>,
  options: Options<T> = {}
) {
  const { persistKey, revalidateOnMount = true, staleTime = 0 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<any>(null);
  const isMounted = useRef(true);
  const lastFetched = useRef<number>(0);

  // Load from cache initially
  useEffect(() => {
    isMounted.current = true;
    if (persistKey) {
      const cached = localStorage.getItem(`pv:cache:${persistKey}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Handle both old format (raw data) and new format ({ data, timestamp })
          const hasTimestamp =
            parsed &&
            typeof parsed === "object" &&
            "timestamp" in parsed &&
            "data" in parsed;

          if (hasTimestamp) {
            setData(parsed.data);
            lastFetched.current = parsed.timestamp;
          } else {
            setData(parsed);
            lastFetched.current = 0; // Treat legacy cache as stale
          }
          setLoading(false);
        } catch (e) {
          console.warn(`Failed to parse cache for ${persistKey}`, e);
        }
      }
    }
    return () => {
      isMounted.current = false;
    };
  }, [persistKey]);

  const refresh = useCallback(
    async (force = false) => {
      if (!isMounted.current) return;

      // Check stale time if not forced
      if (!force && staleTime > 0 && lastFetched.current > 0) {
        const now = Date.now();
        if (now - lastFetched.current < staleTime) {
          console.log(
            `[Cache] Using fresh data for ${persistKey} (${(now - lastFetched.current) / 1000}s old)`
          );
          setLoading(false);
          return;
        }
      }

      setRefreshing(true);
      setError(null);
      try {
        const result = await fetchFn();
        if (!isMounted.current) return;

        const now = Date.now();
        setData(result);
        lastFetched.current = now;

        if (persistKey) {
          const cachePayload = { data: result, timestamp: now };
          localStorage.setItem(
            `pv:cache:${persistKey}`,
            JSON.stringify(cachePayload)
          );
        }
        options.onSuccess?.(result);
      } catch (err) {
        if (!isMounted.current) return;
        setError(err);
        options.onError?.(err);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [fetchFn, persistKey, options, staleTime]
  );

  const revalidated = useRef(false);

  useEffect(() => {
    if (revalidateOnMount && !revalidated.current) {
      revalidated.current = true;
      // Small timeout to allow the initial cache load to populate lastFetched
      setTimeout(() => refresh(), 0);
    }
  }, [revalidateOnMount, refresh]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => refresh(true), // Expose force refresh
    setData,
  };
}
