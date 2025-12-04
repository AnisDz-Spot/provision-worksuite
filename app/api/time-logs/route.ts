import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS time_logs (
    id bigserial primary key,
    task_id text,
    project_id text,
    hours numeric not null default 0,
    note text,
    logged_by text,
    logged_at timestamptz not null default now()
  )`;
}

export async function GET() {
  try {
    await ensureTable();
    const result =
      await sql`SELECT id, task_id, project_id, hours, note, logged_by, logged_at FROM time_logs ORDER BY logged_at DESC`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get time logs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch time logs", data: [] },
      { status: 500 }
    );
  }
}
