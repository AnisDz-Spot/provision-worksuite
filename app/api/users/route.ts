import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_USERS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  // SECURITY: Require authentication to list users
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // In demo mode or for global admin, return mock users
  if (!shouldUseDatabaseData() || shouldReturnMockData(currentUser)) {
    return NextResponse.json({
      success: true,
      data: MOCK_USERS,
      source: "mock",
    });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        uid: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        phone: true,
        bio: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        socials: true,
        statusMessage: true,
        statusEmoji: true,
      },
      orderBy: { id: "asc" }, // Fetch by ID asc to easily identify first user
    });

    const firstUser = users[0];

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
        bio: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        socials: any;
        statusMessage: string | null;
        statusEmoji: string | null;
        id: number;
      }) => {
        const isMasterAdmin = user.id === firstUser?.id;
        const role = isMasterAdmin ? "Master Admin" : user.role;
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
          role: role,
          isMasterAdmin: isMasterAdmin,
          created_at: user.createdAt,
          phone: user.phone,
          bio: user.bio,
          address: addressStr, // Backwards compatibility for TeamTable
          rawAddress: {
            addressLine1: user.addressLine1,
            addressLine2: user.addressLine2,
            city: user.city,
            state: user.state,
            country: user.country,
            postalCode: user.postalCode,
          },
          socials: user.socials || {},
          statusMessage: user.statusMessage,
          statusEmoji: user.statusEmoji,
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
      "Admin",
      "Administrator",
      "Master Admin",
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
      socials,
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

    // Hash password if provided, or use a default one
    let hashedPassword = "";
    if (password_hash) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password_hash, salt);
    } else {
      // Create a default secure password if none provided
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash("ProVision@2024", salt);
    }

    // Create user with Prisma
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        avatarUrl: avatar_url,
        passwordHash: hashedPassword,
        phone,
        bio,
        addressLine1,
        addressLine2,
        city,
        state,
        country,
        postalCode,
        socials: socials || {},
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
