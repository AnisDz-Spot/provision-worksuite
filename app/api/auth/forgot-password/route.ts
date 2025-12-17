import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { log } from "@/lib/logger";
import crypto from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Rate limiting for forgot password (simple in-memory for now)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3;

  const current = requestCounts.get(email);

  if (!current || now > current.resetAt) {
    requestCounts.set(email, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Always return success to prevent email enumeration
    // But only actually send email if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { uid: true, email: true },
    });

    if (user) {
      // Invalidate any existing tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.uid,
          usedAt: null,
        },
        data: {
          usedAt: new Date(), // Mark as used so they can't be used
        },
      });

      // Generate secure token
      const token = crypto.randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await prisma.passwordResetToken.create({
        data: {
          userId: user.uid,
          token,
          expiresAt,
        },
      });

      // Get base URL for reset link
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        request.headers.get("origin") ||
        `https://${request.headers.get("host")}`;

      const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

      // Send email
      const emailResult = await sendPasswordResetEmail(
        user.email,
        token,
        resetLink
      );

      if (!emailResult.success) {
        log.error(
          { email: normalizedEmail, error: emailResult.error },
          "Failed to send password reset email"
        );
        // Still return success to prevent enumeration, but log the error
      } else {
        log.info({ email: normalizedEmail }, "Password reset email sent");
      }
    } else {
      log.info(
        { email: normalizedEmail },
        "Password reset requested for non-existent email"
      );
    }

    // Always return the same response to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    log.error({ err: error }, "Forgot password error");
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
