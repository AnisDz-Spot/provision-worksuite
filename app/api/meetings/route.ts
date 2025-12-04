import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureMeetingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS meetings (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date TIMESTAMP NOT NULL,
      project_id TEXT,
      attendees JSONB DEFAULT '[]',
      content TEXT,
      action_items JSONB DEFAULT '[]',
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

export async function GET() {
  try {
    await ensureMeetingsTable();
    const result = await sql`SELECT * FROM meetings ORDER BY date DESC`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("Meetings GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureMeetingsTable();
    const {
      title,
      date,
      projectId,
      attendees,
      content,
      actionItems,
      createdBy,
    } = await req.json();
    const result = await sql`
      INSERT INTO meetings (title, date, project_id, attendees, content, action_items, created_by)
      VALUES (${title}, ${date}, ${projectId || null}, ${JSON.stringify(attendees || [])}, ${content || ""}, ${JSON.stringify(actionItems || [])}, ${createdBy || null})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Meetings POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
