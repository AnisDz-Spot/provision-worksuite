/**
 * CSRF Protection Utility
 * Implements double-submit cookie pattern for CSRF protection
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Set CSRF token cookie on response
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false, // Must be readable by JavaScript to include in headers
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from request cookie
 */
export function getCsrfTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Get CSRF token from request header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Validate CSRF token - compare header value with cookie value
 * Uses double-submit cookie pattern
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = getCsrfTokenFromCookie(request);
  const headerToken = getCsrfTokenFromHeader(request);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check if request method requires CSRF validation
 */
export function requiresCsrfValidation(method: string): boolean {
  const safeMethod = ["GET", "HEAD", "OPTIONS"];
  return !safeMethod.includes(method.toUpperCase());
}

/**
 * Routes that are exempt from CSRF validation
 * (NextAuth has its own CSRF, webhooks use signatures, etc.)
 */
const CSRF_EXEMPT_ROUTES = [
  "/api/auth/", // NextAuth has built-in CSRF
  "/api/webhook", // Webhooks use signatures
  "/api/setup/", // Setup flow is pre-auth
];

/**
 * Check if route is exempt from CSRF validation
 */
export function isCsrfExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Server action to get or create CSRF token
 * Call this in layouts to ensure token is set
 */
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    cookieStore.set({
      name: CSRF_COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  }

  return token;
}

/**
 * Client-side fetch wrapper that automatically includes the CSRF token
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Methods that require CSRF validation
  const method = options.method?.toUpperCase() || "GET";
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (!needsCsrf) {
    return fetch(url, options);
  }

  // Get token from cookie (client-side only)
  let token = "";
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";");
    const csrfCookie = cookies
      .find((c) => c.trim().startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.split("=")[1];
    token = csrfCookie || "";
  }

  // Add token to headers
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
