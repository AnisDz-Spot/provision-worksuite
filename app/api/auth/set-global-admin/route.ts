import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

/**
 * API route to generate a global admin JWT and set it as a cookie for onboarding/setup flows.
 * POST body: { email: string, role: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: "Missing email or role" },
        { status: 400 }
      );
    }
    const token = await signToken({ uid: "global-admin", email, role });
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to set admin token" },
      { status: 500 }
    );
  }
}
