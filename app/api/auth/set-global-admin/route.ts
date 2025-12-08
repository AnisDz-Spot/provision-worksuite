import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * API route to generate a global admin JWT and set it as a cookie for onboarding/setup flows.
 * SECURITY: Only allowed during initial setup when no users exist in the database.
 * POST body: { email: string, role: string }
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Only allow during initial setup before any users are created
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Setup already complete. Admin tokens can only be generated during initial setup.",
        },
        { status: 403 }
      );
    }

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
      secure: process.env.NODE_ENV === "production",
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
