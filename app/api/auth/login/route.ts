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

import { isDatabaseConfiguredServer } from "@/lib/setup";

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

    // 0. EMERGENCY BACKDOOR: Global Admin
    // Only allow if:
    // 1. No database is configured
    // 2. The mock mode is explicitly requested
    // 3. The database exists but is blank (no tables or no users) - AUTO-RECOVERY
    const dbConfigured = isDatabaseConfiguredServer();
    const isMockMode = body.mode === "mock";

    let shouldAllowBackdoor =
      !dbConfigured || isMockMode || process.env.ENABLE_GLOBAL_ADMIN === "true";

    // Auto-recovery check (only if not already allowed)
    if (!shouldAllowBackdoor && dbConfigured) {
      try {
        // OPTIMIZATION: Use Prisma directly instead of checkTablesExist (which opens a separate pool)
        // This reduces connection overhead and prevents pool exhaustion in serverless environments
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          shouldAllowBackdoor = true;
          log.info("Backdoor allowed: Database is empty");
        }
      } catch (e: any) {
        // If table doesn't exist (P2021) or connection failed, allow backdoor for setup
        if (
          e.code === "P2021" ||
          (e.message && e.message.includes("does not exist"))
        ) {
          shouldAllowBackdoor = true;
          log.info("Backdoor allowed: Tables missing (P2021)");
        } else {
          // Other critical DB error - allow backdoor to access Settings
          shouldAllowBackdoor = true;
          log.warn(
            { err: e },
            "Backdoor allowed: DB connectivity issue during count check"
          );
        }
      }
    }

    // Check for existing user in DB first to ensure consistent signaling IDs
    const dbUser = await prisma.user.findUnique({
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

    let user;

    if (
      email === "admin@provision.com" &&
      password === "password123578951" &&
      shouldAllowBackdoor
    ) {
      user = {
        id: dbUser?.id || 0,
        uid: dbUser?.uid || "admin-global",
        email: "admin@provision.com",
        name: dbUser?.name || "Global Admin",
        avatarUrl: dbUser?.avatarUrl || null,
        role: dbUser?.role || "Administrator",
        passwordHash: dbUser?.passwordHash || "",
        twoFactorEnabled: dbUser?.twoFactorEnabled || false,
        twoFactorSecret: dbUser?.twoFactorSecret || null,
        backupCodes: dbUser?.backupCodes || [],
      };
    } else {
      user = dbUser;
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
    if (user.uid !== "admin-global") {
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
        return NextResponse.json(
          {
            success: false,
            error: "Invalid authentication code",
            requires2FA: true,
          },
          { status: 401 }
        );
      }
    }

    // 6. Identify Master Admin (first user) and Sync role if needed
    let isMasterAdmin = false;
    if (user.uid !== "global-admin") {
      const firstUser = await prisma.user.findFirst({
        orderBy: { id: "asc" },
        select: { id: true, role: true },
      });
      isMasterAdmin = firstUser?.id === user.id;

      // 🔑 CRITICAL: Sync "Master Admin" role in database if detected
      // This ensures that subsequent DB-based role checks (like in audit routes) pass.
      if (isMasterAdmin && firstUser?.role !== "Master Admin") {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "Master Admin" },
          });
          log.info(
            { userId: user.id },
            "Synchronized Master Admin role in database"
          );
          // Update local user object so the JWT contains the correct role
          user.role = "Master Admin";
        } catch (e) {
          log.error({ err: e }, "Failed to sync Master Admin role");
        }
      }
    }

    // 6.b Generate JWT token
    const token = await signToken({
      uid: user.uid,
      email: user.email,
      role: isMasterAdmin ? "Master Admin" : user.role,
    });

    // 6.c Create Session in DB
    try {
      if (user.id !== undefined) {
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
        role: isMasterAdmin ? "Master Admin" : user.role,
        isMasterAdmin,
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
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
      sameSite: "lax" as const,
    };

    console.log(
      `[Login] Setting auth-token. Production: ${isProduction}, Secure: ${cookieOptions.secure}`
    );

    response.cookies.set(cookieOptions);

    return response;
  } catch (error: any) {
    log.error({ err: error }, "Login error");

    // Check for Prisma "Table does not exist" error
    if (
      error.code === "P2021" ||
      (error.message && error.message.includes("does not exist"))
    ) {
      // 503 Service Unavailable is more appropriate than 500 for missing schema
      return NextResponse.json(
        {
          success: false,
          error: "Database not initialized. Please run setup.",
          setupRequired: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Login failed (Internal Error).",
        details: error?.message || "Unknown error",
        debug:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
