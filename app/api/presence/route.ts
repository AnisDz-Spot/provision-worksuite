import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS presence (
    uid text primary key,
    status text not null default 'available',
    last_seen timestamptz not null default now()
  )`;
}

export async function GET() {
  try {
    await ensureTable();
    const result = await sql`SELECT uid, status, last_seen FROM presence`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Presence GET error", error);
    return NextResponse.json(
      { success: false, error: "Failed to load presence" },
      { status: 500 }
    );
  }
}
