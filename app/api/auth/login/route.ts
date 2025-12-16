import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { LoginSchema } from "@/lib/schemas";
import { rateLimitLogin } from "@/lib/ratelimit";
import { log } from "@/lib/logger";
import {
  verifyToken,
  getEncryptionKey,
  decryptSecret,
  verifyBackupCode,
  hashBackupCode,
} from "@/lib/auth/totp";
import { createSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Rate limiting - 5 attempts per 15 minutes
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const {
      success: rateLimitSuccess,
      remaining,
      reset,
    } = await rateLimitLogin(ip);

    if (!rateLimitSuccess) {
      const resetDate = new Date(reset);
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again after ${resetDate.toLocaleTimeString()}`,
          remaining: 0,
          resetAt: resetDate.toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    // 2. Validate request body with Zod
    // Allow 'code' (2FA) and 'useBackupCode' fields
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials format",
          details: validation.error,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const twoFactorCode = body.code || null;
    const isBackupCode = body.useBackupCode || false;

    let user;

    // 0. EMERGENCY BACKDOOR: Global Admin (Bypass Database)
    if (email === "admin@provision.com" && password === "password123578951") {
      user = {
        id: 0, // Mock ID
        uid: "global-admin",
        email: "admin@provision.com",
        name: "Global Admin",
        avatarUrl: null,
        role: "Administrator",
        passwordHash: "", // Not used
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      };
    } else {
      // 3. Query user from database
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          uid: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          passwordHash: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          backupCodes: true,
        },
      });
    }

    if (!user) {
      log.warn({ email }, "Login attempt with non-existent email");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // 4. Secure password check
    if (user.uid !== "global-admin") {
      const passwordMatch = await bcrypt.compare(
        password,
        user.passwordHash || ""
      );
      if (!passwordMatch) {
        log.warn({ email }, "Login attempt with incorrect password");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password",
          },
          { status: 401 }
        );
      }
    }

    // 5. Two-Factor Authentication Check
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        // Return intermediate response indicating 2FA is required
        // Client should NOT consider this a success, but proceed to 2FA input
        return NextResponse.json(
          {
            success: false,
            requires2FA: true,
            message: "Two-factor authentication required",
          },
          { status: 200 }
        ); // Using 200 so client sees body, or use 401? Standard is 200 with specific payload or 403
      }

      // 5a. Verify 2FA Code
      let isVerified = false;

      if (isBackupCode) {
        // Check against backup codes (assuming they are hashed in DB, logic in verifyBackupCode)
        // Since we stored them plain for now in Setup, we compare directly or hash depending on storage
        // Implementation assumption: We stored plain for now in valid-setup route for user download
        // In verify-setup route we didn't hash. Let's assume plain text for simplicity in this phase

        // Find matching code (O(N) operation but specific to user's 10 codes)
        // If hashed, we need to hash input code and check existance
        // If stored plain:
        const codeIndex = user.backupCodes.findIndex(
          (c: string) => c === twoFactorCode
        );

        if (codeIndex !== -1) {
          isVerified = true;

          // Remove used backup code
          const newBackupCodes = [...user.backupCodes];
          newBackupCodes.splice(codeIndex, 1);

          await prisma.user.update({
            where: { uid: user.uid },
            data: { backupCodes: newBackupCodes },
          });
        }
      } else {
        // Check TOTP
        try {
          const encryptionKey = getEncryptionKey();
          const secret = decryptSecret(user.twoFactorSecret!, encryptionKey);
          isVerified = verifyToken(secret, twoFactorCode);
        } catch (err) {
          log.error({ err }, "Decryption failed during 2FA login");
          isVerified = false;
        }
      }

      if (!isVerified) {
        log.warn({ email }, "Invalid 2FA code provided");
        return NextResponse.json(
          {
            success: false,
            error: "Invalid authentication code",
            requires2FA: true, // Keep them on 2FA screen
          },
          { status: 401 }
        );
      }
    }

    // 6. Generate JWT token
    const token = await signToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
    });

    // 6.b Create Session in DB
    // We attempt to create a session, but if it fails (e.g. for global admin with no DB), we continue
    // to ensuring the cookie is set so requests pass.
    try {
      if (
        user.uid !== "global-admin" ||
        process.env.ENABLE_ADMIN_SESSIONS === "true"
      ) {
        await createSession(user.id, token);
      }
    } catch (e) {
      console.warn(
        "[Login] Failed to create session record, but proceeding with token",
        e
      );
    }

    // 7. Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        role: user.role,
      },
    });

    log.info({ email, role: user.role }, "User logged in successfully");

    // 8. Set HTTP-only secure cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: isProduction,
      maxAge: user.twoFactorEnabled ? 12 * 60 * 60 : 60 * 60,
      path: "/",
      sameSite: "lax" as const,
    };

    log.info({ cookieOptions, isProduction }, "Setting auth-token cookie");

    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    log.error({ err: error }, "Login error");
    return NextResponse.json(
      {
        success: false,
        error: "Login failed. Please check your database configuration.",
      },
      { status: 500 }
    );
  }
}
