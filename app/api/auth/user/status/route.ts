/**
 * User Auth Status API
 *
 * Returns the current user's authentication status including 2FA settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user details from DB
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        backupCodes: true,
        passwordHash: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Return auth status
    return NextResponse.json({
      success: true,
      data: {
        twoFactorEnabled: dbUser.twoFactorEnabled,
        twoFactorVerifiedAt: dbUser.twoFactorVerifiedAt,
        backupCodesRemaining: dbUser.backupCodes?.length || 0,
        hasPassword: !!dbUser.passwordHash,
        linkedProviders: dbUser.accounts.map(
          (acc: { provider: string }) => acc.provider
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json(
      { error: "Failed to fetch user status" },
      { status: 500 }
    );
  }
}
