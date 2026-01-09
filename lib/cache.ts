"use client";

/**
 * Invalidates a specific cache key by removing it from localStorage.
 * This forces useRevalidatedData to fetch fresh data on the next mount/refresh.
 *
 * @param key The persistKey used in useRevalidatedData (without prefix)
 */
export function invalidateCache(key: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(`pv:cache:${key}`);
    console.log(`[Cache] Invalidated ${key}`);
  } catch (error) {
    console.error("Failed to invalidate cache:", error);
  }
}
