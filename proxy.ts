import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

/**
 * Middleware to protect API routes with authentication
 * Public routes are allowed, all others require valid JWT token
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/api/auth/login",
    "/api/setup/create-admin",
    "/api/test-db-connection",
    "/api/db-status",
    "/api/check-license",
  ];

  // Allow public API routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Protected API routes - require authentication
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Add user info to headers for API routes to access
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", user.uid);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-role", user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Non-API routes pass through
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
