/**
 * Shared authentication utilities and types
 * This file is client-safe (no server-only dependencies)
 */

export type AuthUser = {
  uid: string;
  id?: string; // Support for both DB ID and Auth UID
  email: string;
  role: string;
  name?: string;
};

export const GLOBAL_ADMIN_UID = "admin-global";
export const GLOBAL_ADMIN_EMAIL = "admin@provision.com";

/**
 * Check if user is Global Admin (test mode)
 */
export function isGlobalAdmin(user: any): boolean {
  if (!user) return false;
  // Handle both uid and id for compatibility with different user models
  const uid = user.uid || user.id;
  const email = user.email;
  return uid === GLOBAL_ADMIN_UID || email === GLOBAL_ADMIN_EMAIL;
}

/**
 * Role-based permission helpers
 */
export function isAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const role = user.role?.toLowerCase() || "";
  return (
    role === "admin" ||
    role === "administrator" ||
    role === "master admin" ||
    isGlobalAdmin(user)
  );
}

export function isProjectManager(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const role = user.role?.toLowerCase() || "";
  return role === "project manager";
}

export function canEditProject(user: AuthUser | null | undefined): boolean {
  return isAdmin(user) || isProjectManager(user);
}
