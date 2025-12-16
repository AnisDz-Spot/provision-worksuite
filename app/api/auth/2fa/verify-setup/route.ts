import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  verifyToken,
  encryptSecret,
  getEncryptionKey,
  generateBackupCodes,
  decryptSecret,
} from "@/lib/auth/totp";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from DB
    const user = await prisma.user.findUnique({
      where: { uid: authUser.uid },
      select: { id: true, twoFactorSecret: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request body
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // 3. Get temporary secret from DB (it's stored but 2FA is not enabled yet)
    // We already fetched it above as 'twoFactorSecret'
    const dbUser = user;

    if (!dbUser?.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA setup not initiated. Request new setup." },
        { status: 400 }
      );
    }

    // 4. Decrypt secret
    try {
      const encryptionKey = getEncryptionKey();
      const secret = decryptSecret(dbUser.twoFactorSecret, encryptionKey);

      // 5. Verify token against secret
      const isValid = verifyToken(secret, token);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }

      // 6. Generate backup codes
      const backupCodes = generateBackupCodes(10);

      // 7. Hash backup codes for storage (TODO: Add hashing utility)
      // For now, storing plain text to ensure user gets them, ideally should hash
      // In a real app, we'd hash them before storage:
      // const hashedCodes = backupCodes.map(code => hashBackupCode(code));

      // 8. Enable 2FA and save codes
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          twoFactorVerifiedAt: new Date(),
          backupCodes: backupCodes, // Storing plain for now, should hash in production
        },
      });

      // 9. Return backup codes to user (ONE TIME ONLY display)
      return NextResponse.json({
        success: true,
        backupCodes,
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      return NextResponse.json(
        { error: "Verification failed due to server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying 2FA setup:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA Setup" },
      { status: 500 }
    );
  }
}
