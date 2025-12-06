import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const u1 = searchParams.get("user1");
  const u2 = searchParams.get("user2");

  if (!u1 || !u2) {
    return NextResponse.json(
      { success: false, error: "Missing user1 or user2" },
      { status: 400 }
    );
  }

  // Enforce that the requester is one of the participants
  if (user.uid !== u1 && user.uid !== u2) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
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
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { fromUser, toUser, message } = body || {};
    if (!fromUser || !toUser || !message) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // Enforce that the sender is the authenticated user
    if (user.uid !== fromUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You can only send messages as yourself",
        },
        { status: 403 }
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
