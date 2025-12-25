import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch full user details from DB to get the most accurate role and info
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: {
        id: true,
        uid: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!dbUser) {
      // Fallback to session user if not found in DB (e.g. Global Admin)
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error("Fetch current user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
