import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS messages (
    id bigserial primary key,
    from_user text not null,
    to_user text not null,
    message text not null,
    created_at timestamptz not null default now(),
    is_read boolean not null default false
  )`;
}

export async function POST(request: Request) {
  try {
    await ensureTable();
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
