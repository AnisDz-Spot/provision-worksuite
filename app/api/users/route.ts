import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET() {
  // In demo mode, return empty users
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({ success: true, data: [], source: "demo" });
  }

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
        uid: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        phone: true,
        addressLine1: true,
        city: true,
        country: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to match frontend expectations (if needed)
    const mappedUsers = users.map(
      (user: {
        uid: string;
        email: string;
        name: string;
        avatarUrl: string | null;
        role: string;
        createdAt: Date;
        phone: string | null;
        addressLine1: string | null;
        city: string | null;
        country: string | null;
      }) => {
        // Construct basic address string
        const addressParts = [user.city, user.country].filter(Boolean);
        const addressStr =
          addressParts.length > 0
            ? addressParts.join(", ")
            : user.addressLine1 || "-";

        return {
          uid: user.uid,
          email: user.email,
          name: user.name,
          avatar_url: user.avatarUrl,
          role: user.role,
          created_at: user.createdAt,
          phone: user.phone,
          address: addressStr, // Backwards compatibility for TeamTable
          rawAddress: {
            addressLine1: user.addressLine1,
            city: user.city,
            country: user.country,
          },
        };
      }
    );

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
    const allowedRoles = [
      "admin",
      "global-admin",
      "Administrator",
      "Project Manager",
    ];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: ${currentUser.role} role not permitted to create users`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      role,
      avatar_url,
      password_hash,
      phone,
      bio,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
    } = body;

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
        name,
        role,
        avatarUrl: avatar_url,
        passwordHash: password_hash || "",
        phone,
        bio,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
      },
    });

    log.info({ email, userId: user.uid }, "User created");

    return NextResponse.json({ success: true, user });
  } catch (error) {
    log.error({ err: error }, "Create user error");
    return NextResponse.json(
      { success: false, error: "Failed to create user." },
      { status: 500 }
    );
  }
}
