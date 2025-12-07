import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { LoginSchema } from "@/lib/schemas";
import { rateLimitLogin } from "@/lib/ratelimit";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Rate limiting - 5 attempts per 15 minutes
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

    // Validate request body with Zod
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials format",
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Query user from database using Prisma
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        systemRole: true,
        passwordHash: true,
      },
    });

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

    // Secure password check using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
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

    // Generate JWT token
    const token = await signToken({
      uid: user.userId,
      email: user.email,
      role: user.systemRole,
    });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        uid: user.userId,
        email: user.email,
        name: user.fullName,
        avatar_url: user.avatarUrl,
        role: user.systemRole,
      },
    });

    log.info({ email, role: user.systemRole }, "User logged in successfully");

    // Set HTTP-only secure cookie with improved settings
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: true, // Always use secure cookies (HTTPS required)
      maxAge: 60 * 60, // 1 hour (shorter session for better security)
      path: "/",
      sameSite: "lax", // Balance security and OAuth compatibility
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Login failed. Please check your database configuration.",
      },
      { status: 500 }
    );
  }
}
