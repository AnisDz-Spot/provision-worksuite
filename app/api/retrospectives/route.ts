import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureRetrospectivesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS retrospectives (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      project_id TEXT,
      sprint_number INTEGER,
      date TIMESTAMP NOT NULL,
      attendees JSONB DEFAULT '[]',
      went_well JSONB DEFAULT '[]',
      needs_improvement JSONB DEFAULT '[]',
      action_items JSONB DEFAULT '[]',
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

export async function GET() {
  try {
    await ensureRetrospectivesTable();
    const result = await sql`SELECT * FROM retrospectives ORDER BY date DESC`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("Retrospectives GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureRetrospectivesTable();
    const {
      title,
      projectId,
      sprintNumber,
      date,
      attendees,
      wentWell,
      needsImprovement,
      actionItems,
      createdBy,
    } = await req.json();
    const result = await sql`
      INSERT INTO retrospectives (title, project_id, sprint_number, date, attendees, went_well, needs_improvement, action_items, created_by)
      VALUES (
        ${title},
        ${projectId || null},
        ${sprintNumber || null},
        ${date},
        ${JSON.stringify(attendees || [])},
        ${JSON.stringify(wentWell || [])},
        ${JSON.stringify(needsImprovement || [])},
        ${JSON.stringify(actionItems || [])},
        ${createdBy || null}
      )
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Retrospectives POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
