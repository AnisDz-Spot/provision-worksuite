import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  validateCsrfToken,
  requiresCsrfValidation,
  isCsrfExempt,
  generateCsrfToken,
  setCsrfCookie,
} from "@/lib/csrf";

/**
 * Middleware to protect API routes with authentication and CSRF
 * Public routes are allowed, all others require valid JWT token
 * State-changing requests require CSRF validation
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/callback", // NextAuth OAuth callbacks
    "/api/auth/signin", // NextAuth signin
    "/api/auth/signout", // NextAuth signout
    "/api/auth/session", // NextAuth session check
    "/api/auth/providers", // NextAuth providers list
    "/api/auth/csrf", // NextAuth CSRF token
    "/api/setup/create-admin",
    "/api/setup/check-system",
    "/api/setup/config",
    "/api/setup/upload-avatar",
    "/api/setup-db",
    "/api/test-db-connection",
    "/api/db-status",
    "/api/check-license",
    "/api/support/email",
    "/api/auth/register", // Registration doesn't require auth
    "/api/debug", // Allow all debug endpoints
  ];

  // Allow public API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected API routes - require authentication
  if (pathname.startsWith("/api/")) {
    // Check for auth token in cookies
    const allCookies = request.cookies.getAll();
    console.log(
      `[Proxy] All cookies: ${allCookies.map((c) => c.name).join(", ")}`
    );

    const token = request.cookies.get("auth-token")?.value;

    console.log(`[Proxy] Request to ${pathname} method ${method}`);
    console.log(`[Proxy] Token present: ${!!token}`);

    if (token) {
      // Log token prefix for debugging
      console.log(`[Proxy] Token starts with: ${token.substring(0, 10)}...`);
    }

    if (!token) {
      console.log("[Proxy] No token found, blocking request");
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      console.log("[Proxy] Token verification failed");
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // CSRF validation for state-changing requests
    if (requiresCsrfValidation(method) && !isCsrfExempt(pathname)) {
      if (!validateCsrfToken(request)) {
        return NextResponse.json(
          { error: "Forbidden - Invalid CSRF token" },
          { status: 403 }
        );
      }
    }

    // Add user info to headers for API routes to access
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.uid);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-role", user.role);

    // Ensure CSRF token cookie exists for authenticated users
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Set CSRF cookie if not present
    if (!request.cookies.get("csrf-token")) {
      setCsrfCookie(response, generateCsrfToken());
    }

    return response;
  }

  // Non-API routes pass through
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
