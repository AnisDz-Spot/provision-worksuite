/**
 * Mock Data Helper for API Routes
 * Detects if request is from global admin (dummy mode)
 */

import { AuthUser, isGlobalAdmin } from "@/lib/auth";

/**
 * Should return mock data for this user?
 */
export function shouldReturnMockData(
  user: AuthUser | null | undefined
): boolean {
  return isGlobalAdmin(user as AuthUser | null);
}
