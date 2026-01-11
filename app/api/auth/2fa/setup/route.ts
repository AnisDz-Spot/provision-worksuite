import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import {
  generateSecret,
  generateQRCode,
  encryptSecretForTenant,
} from "@/lib/auth/totp";
import prisma from "@/lib/prisma";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withRateLimit(RATE_LIMITS.AUTH, async (request: any) => {
  try {
    // 1. Verify user is authenticated
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from DB to get the numeric ID and tenantId
    const user = await prisma.user.findUnique({
      where: { uid: authUser.uid },
      select: { id: true, email: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Generate new TOTP secret (base32)
    const secret = generateSecret();

    // 3. Encrypt secret for storage using tenant-specific DEK
    try {
      const encryptedSecret = await encryptSecretForTenant(
        secret,
        user.tenantId
      );

      // 4. Update user with new secret (but keep 2FA disabled until verification)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: encryptedSecret,
          twoFactorEnabled: false, // Ensure it's disabled until verified
          twoFactorVerifiedAt: null,
        },
      });
    } catch (keyError) {
      console.error("Encryption key error:", keyError);
      return NextResponse.json(
        { error: "Server configuration error: Encryption key missing" },
        { status: 500 }
      );
    }

    // 5. Generate QR code for frontend display
    const qrCode = await generateQRCode(
      user.email,
      secret,
      "ProVision WorkSuite"
    );

    // 6. Return secret (for manual entry) and QR code data URL
    return NextResponse.json({
      secret,
      qrCode,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return NextResponse.json({ error: "Failed to setup 2FA" }, { status: 500 });
  }
});
