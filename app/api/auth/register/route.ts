import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/db/postgres";
import { CreateAdminSchema } from "@/lib/schemas";
import { rateLimitSignup } from "@/lib/ratelimit";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting - 3 attempts per hour per IP
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const { success: rateLimitSuccess } = await rateLimitSignup(ip);

    if (!rateLimitSuccess) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();

    // SECURITY: Validate input with Zod schema
    const validation = CreateAdminSchema.safeParse({
      ...body,
      username: body.email?.split("@")[0] || "user", // Generate username from email if not provided
      name: body.fullName || body.name,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { email, password, name: fullName } = validation.data;

    // 1. Check if ANY user exists
    const userCount = await prisma.user.count();

    if (userCount > 0) {
      // If users exist, blocking public registration for now (per plan)
      // Future: allow invites
      return NextResponse.json(
        {
          error:
            "Registration is closed. Please ask an administrator for an invite.",
        },
        { status: 403 }
      );
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User (Admin)
    const newUser = await createUser({
      email,
      passwordHash: hashedPassword,
      name: fullName,
      role: "admin", // First user is admin
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    log.error({ err: error }, "Registration error");
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
