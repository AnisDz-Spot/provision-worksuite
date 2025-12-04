import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentUser, otherUser } = body || {};
    if (!currentUser || !otherUser) {
      return NextResponse.json(
        { success: false, error: "Missing users" },
        { status: 400 }
      );
    }
    await sql`
      UPDATE messages SET is_read = true
      WHERE to_user = ${currentUser} AND from_user = ${otherUser} AND is_read = false
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
