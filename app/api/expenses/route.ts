import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

async function ensureExpensesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      project_id TEXT,
      date TEXT NOT NULL,
      vendor TEXT NOT NULL,
      amount NUMERIC(10, 2) NOT NULL,
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

export async function GET() {
  try {
    await ensureExpensesTable();
    const result = await sql`SELECT * FROM expenses ORDER BY date DESC`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("Expenses GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureExpensesTable();
    const { projectId, date, vendor, amount, note } = await req.json();
    const result = await sql`
      INSERT INTO expenses (project_id, date, vendor, amount, note)
      VALUES (${projectId}, ${date}, ${vendor}, ${amount}, ${note || ""})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
