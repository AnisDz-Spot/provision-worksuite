import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, name, email, password, avatarUrl } = body;

    // Validate required fields
    if (!username || !name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await sql`
      SELECT user_id FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A user with this email already exists",
        },
        { status: 400 }
      );
    }

    // Insert admin user into database
    const result = await sql`
      INSERT INTO users (email, password_hash, full_name, avatar_url, system_role, created_at)
      VALUES (
        ${email},
        ${password},
        ${name},
        ${avatarUrl || null},
        'Administrator',
        NOW()
      )
      RETURNING user_id, email, full_name, avatar_url, system_role
    `;

    const user = result.rows[0];

    // Return success with user data
    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.full_name,
        avatarUrl: user.avatar_url,
        role: user.system_role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
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
