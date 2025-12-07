import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      return NextResponse.json({
        allowed: true,
        role: "admin", // First user is admin
        reason: "First user registration",
      });
    }

    // In the future: check for invites or public registration setting
    return NextResponse.json({
      allowed: false,
      reason:
        "Registration is closed. Please ask an administrator for an invite.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        allowed: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
