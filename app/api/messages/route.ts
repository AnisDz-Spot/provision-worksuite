import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const u1 = searchParams.get("user1");
  const u2 = searchParams.get("user2");
  if (!u1 || !u2) {
    return NextResponse.json(
      { success: false, error: "Missing user1 or user2" },
      { status: 400 }
    );
  }
  try {
    const result = await sql`
      SELECT id, from_user, to_user, message, created_at, is_read
      FROM messages
      WHERE (from_user = ${u1} AND to_user = ${u2}) OR (from_user = ${u2} AND to_user = ${u1})
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get thread error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages", data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromUser, toUser, message } = body || {};
    if (!fromUser || !toUser || !message) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }
    const result = await sql`
      INSERT INTO messages (from_user, to_user, message)
      VALUES (${fromUser}, ${toUser}, ${message})
      RETURNING id, from_user, to_user, message, created_at, is_read
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
