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
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/auth/callback",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/auth/session",
    "/api/auth/providers",
    "/api/auth/csrf",
    "/api/setup/create-admin",
    "/api/setup/check-system",
    "/api/setup/config",
    "/api/setup/upload-avatar",
    "/api/setup-db",
    "/api/test-db-connection",
    "/api/db-status",
    "/api/check-license",
    "/api/support/email",
    "/api/auth/register",
    "/api/debug",
    "/api/auth/register-status", // Ensure this is public
  ];

  // Allow public API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected API routes - require authentication
  if (pathname.startsWith("/api/")) {
    const allCookies = request.cookies.getAll();
    const token = request.cookies.get("auth-token")?.value;

    console.log(`[Proxy] ${method} ${pathname}`);
    console.log(
      `[Proxy] Cookies found: ${allCookies.map((c) => c.name).join(", ")}`
    );
    console.log(`[Proxy] auth-token present: ${!!token}`);

    if (!token) {
      console.log(`[Proxy] 401 Unauthorized: No token found for ${pathname}`);
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      console.log(
        `[Proxy] 401 Unauthorized: Token verification failed for ${pathname}`
      );
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // CSRF validation for state-changing requests
    if (requiresCsrfValidation(method) && !isCsrfExempt(pathname)) {
      if (!validateCsrfToken(request)) {
        console.log(
          `[Proxy] 403 Forbidden: CSRF validation failed for ${pathname}`
        );
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

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
