/**
 * Regenerate Backup Codes API
 *
 * Allows authenticated users to regenerate their 2FA backup codes.
 * Requires password confirmation for security.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateBackupCodes } from "@/lib/auth/totp";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get password from request for confirmation
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password confirmation required" },
        { status: 400 }
      );
    }

    // 3. Get user from DB to verify password and check 2FA status
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: {
        id: true,
        passwordHash: true,
        twoFactorEnabled: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Verify 2FA is enabled
    if (!dbUser.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled" },
        { status: 400 }
      );
    }

    // 5. Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      dbUser.passwordHash || ""
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // 6. Generate new backup codes
    const backupCodes = generateBackupCodes(10);

    // 7. Update user with new backup codes
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        backupCodes: backupCodes,
      },
    });

    // 8. Return new codes (ONE TIME ONLY display)
    return NextResponse.json({
      success: true,
      backupCodes,
      message:
        "New backup codes generated. Save these codes securely - old codes are now invalid.",
    });
  } catch (error) {
    console.error("Error regenerating backup codes:", error);
    return NextResponse.json(
      { error: "Failed to regenerate backup codes" },
      { status: 500 }
    );
  }
}
