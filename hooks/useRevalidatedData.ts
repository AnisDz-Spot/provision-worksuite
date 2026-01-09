"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Options<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  persistKey?: string;
  revalidateOnMount?: boolean;
}

export function useRevalidatedData<T>(
  fetchFn: () => Promise<T>,
  options: Options<T> = {}
) {
  const { persistKey, revalidateOnMount = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<any>(null);
  const isMounted = useRef(true);

  // Load from cache initially
  useEffect(() => {
    isMounted.current = true;
    if (persistKey) {
      const cached = localStorage.getItem(`pv:cache:${persistKey}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setData(parsed);
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

  const refresh = useCallback(async () => {
    if (!isMounted.current) return;
    setRefreshing(true);
    setError(null);
    try {
      const result = await fetchFn();
      if (!isMounted.current) return;

      setData(result);
      if (persistKey) {
        localStorage.setItem(`pv:cache:${persistKey}`, JSON.stringify(result));
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
  }, [fetchFn, persistKey, options]);

  const revalidated = useRef(false);

  useEffect(() => {
    if (revalidateOnMount && !revalidated.current) {
      revalidated.current = true;
      refresh();
    }
  }, [revalidateOnMount, refresh]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh,
    setData, // Useful for optimistic updates
  };
}
