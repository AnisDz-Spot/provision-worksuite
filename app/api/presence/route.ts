import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
