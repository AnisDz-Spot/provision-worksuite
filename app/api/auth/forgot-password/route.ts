import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { log } from "@/lib/logger";
import crypto from "crypto";
import { z } from "zod";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Rate limiting logic removed - handled by withRateLimit wrapper

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const POST = withRateLimit(
  RATE_LIMITS.AUTH, // Using AUTH limits for password reset
  async (request: any) => {
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

      // Rate limiting handled by wrapper

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
);
