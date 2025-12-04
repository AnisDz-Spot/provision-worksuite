import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS presence (
    uid text primary key,
    status text not null default 'available',
    last_seen timestamptz not null default now()
  )`;
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const body = await request.json();
    const { uid, status } = body || {};
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing uid" },
        { status: 400 }
      );
    }
    const stat = typeof status === "string" && status ? status : "available";
    const result = await sql`
      INSERT INTO presence (uid, status, last_seen)
      VALUES (${uid}, ${stat}, now())
      ON CONFLICT (uid) DO UPDATE SET status = ${stat}, last_seen = now()
      RETURNING uid, status, last_seen
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Presence heartbeat error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update presence" },
      { status: 500 }
    );
  }
}
