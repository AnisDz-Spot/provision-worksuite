import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CreateAdminSchema } from "@/lib/schemas";
import { rateLimitSignup } from "@/lib/ratelimit";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Rate limiting - 3 signups per hour per IP
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const {
      success: rateLimitSuccess,
      remaining,
      reset,
    } = await rateLimitSignup(ip);

    if (!rateLimitSuccess) {
      const resetDate = new Date(reset);
      return NextResponse.json(
        {
          success: false,
          error: `Too many signup attempts. Please try again after ${resetDate.toLocaleTimeString()}`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    // Validate request body with Zod
    const validation = CreateAdminSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { username, name, email, password, avatarUrl, timezone } =
      validation.data;

    // Check if user already exists using Prisma
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { userId: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "A user with this email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password with 12 rounds (stronger than default 10)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with Prisma
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: name,
        avatarUrl: avatarUrl || null,
        systemRole: "Administrator",
        timezone: timezone || "UTC",
        employmentType: "full-time",
        isActive: true,
        isBillable: true,
        defaultWorkingHoursPerDay: 8.0,
      },
      select: {
        userId: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        systemRole: true,
        timezone: true,
      },
    });

    log.info({ email, role: "Administrator" }, "Admin account created");

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        user_id: user.userId,
        email: user.email,
        name: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.systemRole,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    log.error({ err: error }, "Create admin error");
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create admin account",
      },
      { status: 500 }
    );
  }
}
