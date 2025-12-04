import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureWikiTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS wiki (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      project_id TEXT,
      tags JSONB DEFAULT '[]',
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

export async function GET() {
  try {
    await ensureWikiTable();
    const result = await sql`SELECT * FROM wiki ORDER BY updated_at DESC`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("Wiki GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureWikiTable();
    const { title, content, projectId, tags, createdBy } = await req.json();
    const result = await sql`
      INSERT INTO wiki (title, content, project_id, tags, created_by)
      VALUES (${title}, ${content || ""}, ${projectId || null}, ${JSON.stringify(tags || [])}, ${createdBy || null})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Wiki POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
