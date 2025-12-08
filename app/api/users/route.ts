import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // SECURITY: Require authentication to list users
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        userId: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        systemRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to match frontend expectations (if needed)
    const mappedUsers = users.map((user) => ({
      uid: user.userId,
      email: user.email,
      name: user.fullName,
      avatar_url: user.avatarUrl,
      role: user.systemRole,
      created_at: user.createdAt,
    }));

    log.info({ count: users.length }, "Fetched all users");

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      source: "database",
    });
  } catch (error) {
    log.error({ err: error }, "Get users error");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users from database",
        data: [],
        source: "database",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // SECURITY: Require authentication and admin role to create users
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only admins can create new users
    if (currentUser.role !== "admin" && currentUser.role !== "global-admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role, avatar_url, password_hash, phone } = body;

    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Name, email, and role are required." },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists." },
        { status: 409 }
      );
    }

    // Create user with Prisma
    const user = await prisma.user.create({
      data: {
        email,
        fullName: name,
        systemRole: role,
        avatarUrl: avatar_url,
        passwordHash: password_hash || "",
        phoneNumber: phone,
        // Note: bio, addressLine1, etc. don't exist in the Prisma schema
        // If needed, add them to the schema first
        employmentType: "full-time", // default
        timezone: "UTC", // default
      },
    });

    log.info({ email, userId: user.userId }, "User created");

    return NextResponse.json({ success: true, user });
  } catch (error) {
    log.error({ err: error }, "Create user error");
    return NextResponse.json(
      { success: false, error: "Failed to create user." },
      { status: 500 }
    );
  }
}
