// lib/session.ts - Session Management Utilities
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signToken, verifyToken } from "./auth";

export const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
export const REFRESH_THRESHOLD = 24 * 60 * 60; // Refresh if less than 1 day left

export interface SessionUser {
  uid: string;
  email: string;
  role: string;
  name?: string;
}

/**
 * Create a new session with HTTP-only cookie
 */
export async function createSession(user: SessionUser): Promise<{
  token: string;
  expiresAt: number;
}> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

  const token = await signToken({
    uid: user.uid,
    email: user.email,
    role: user.role,
    ...(user.name && { name: user.name }),
    exp: expiresAt,
  } as any);

  // Set the cookie (Next.js 13+ App Router)
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return { token, expiresAt };
}

/**
 * Refresh session if needed (called on API requests)
 */
export async function refreshSessionIfNeeded(
  token: string
): Promise<string | null> {
  try {
    const payload = await verifyToken(token);

    if (!payload) return null;

    const exp = (payload as any).exp;
    if (!exp) return null;

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = exp - now;

    // If less than REFRESH_THRESHOLD left, issue new token
    if (timeLeft < REFRESH_THRESHOLD && timeLeft > 0) {
      const newExpiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION;

      const newToken = await signToken({
        ...payload,
        exp: newExpiresAt,
      } as any);

      // Update cookie
      const cookieStore = await cookies();
      cookieStore.set("auth-token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_DURATION,
        path: "/",
      });

      return newToken;
    }

    return null; // No refresh needed
  } catch (error) {
    return null;
  }
}

/**
 * Invalidate session (logout)
 */
export async function invalidateSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

/**
 * Get session from request (Read-only)
 * Safe to call from Server Components as it no longer mutates cookies
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  try {
    const payload = await verifyToken(token);

    if (!payload) return null;

    // Check if token is expired
    const exp = (payload as any).exp;
    if (exp && exp < Math.floor(Date.now() / 1000)) {
      // NOTE: We cannot delete the cookie here if called from a Server Component
      return null;
    }

    // NOTE: We cannot refresh the cookie here if called from a Server Component
    // refreshSessionIfNeeded(token) removed

    return {
      uid: payload.uid,
      email: payload.email,
      role: payload.role,
      name: (payload as any).name,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Server action to refresh session
 * Call this from Client Components or Route Handlers
 */
export async function refreshSessionAction(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return await refreshSessionIfNeeded(token);
}

/**
 * Create NextResponse with session header for token refresh
 */
export function withSessionRefresh(
  response: NextResponse,
  newToken: string | null
): NextResponse {
  if (newToken) {
    response.headers.set("X-Token-Refreshed", "true");
  }
  return response;
}
