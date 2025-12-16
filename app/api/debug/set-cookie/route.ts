import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/api/debug/auth", request.url)
  );

  // Try setting 3 variations of cookies to see which one sticks using the same attrs as login

  // 1. The exact one we use in login
  response.cookies.set({
    name: "auth-token",
    value: "debug-token-" + Date.now(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
    sameSite: "lax",
  });

  // 2. A completely insecure one
  response.cookies.set({
    name: "test-insecure",
    value: "working",
    httpOnly: false,
    secure: false,
    path: "/",
  });

  // 3. A secure one (even if in dev, to check behavior)
  response.cookies.set({
    name: "test-secure",
    value: "working",
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "none",
  });

  return response;
}
