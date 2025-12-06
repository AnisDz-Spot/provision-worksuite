import prisma from "@/lib/prisma";
import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result =
      await sql`SELECT uid, email, name, avatar_url, role, created_at FROM users ORDER BY created_at DESC`;

    return NextResponse.json({
      success: true,
      data: result.rows,
      source: "database",
    });
  } catch (error) {
    console.error("Get users error:", error);
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

    // Generate a unique uid for the user
    const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        uid,
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
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user." },
      { status: 500 }
    );
  }
}
