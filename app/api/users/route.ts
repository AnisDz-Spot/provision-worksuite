import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

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
