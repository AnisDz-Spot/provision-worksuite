import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

/**
 * API route to set global admin JWT as cookie and redirect to profile setup.
 * GET: /api/auth/redirect-global-admin
 */
export async function GET(request: NextRequest) {
  const email = "admin@provision.com";
  const role = "admin";
  const token = await signToken({ uid: "global-admin", email, role });
  const response = NextResponse.redirect(
    new URL("/settings?tab=profile&setup=true", request.url)
  );
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });
  return response;
}
