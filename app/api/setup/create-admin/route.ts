import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CreateAdminSchema } from "@/lib/schemas";
import { rateLimitSignup } from "@/lib/ratelimit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

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

    const { name, email, password, avatarUrl } = validation.data;

    // 🔑 ADDED: Connectivity Check
    // This helps identify if the DB is reachable BEFORE attempting heavy operations
    try {
      await prisma.$connect();
      // Optional: Quick query to verify schema
      await prisma.$queryRaw`SELECT 1`;
    } catch (connErr) {
      log.error({ err: connErr }, "Database connection failed during setup");
      return NextResponse.json(
        {
          success: false,
          error:
            "Database connection failed. Please check your connection string and SSL settings.",
          details: connErr instanceof Error ? connErr.message : String(connErr),
          hint: "The connection was terminated unexpectedly or SSL is required.",
        },
        { status: 503 }
      );
    }

    // Check if user already exists using Prisma
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { uid: true },
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

    // Hash password with 10 rounds (standard)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with Prisma
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl: avatarUrl || null,
        role: "admin",
      },
      select: {
        uid: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
      },
    });

    log.info({ email, role: "admin" }, "Admin account created");

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        user_id: user.uid,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
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
