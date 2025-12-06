import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

async function ensureInvoicesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      project_id TEXT,
      invoice_number TEXT NOT NULL,
      date TEXT NOT NULL,
      due_date TEXT,
      amount NUMERIC(10, 2) NOT NULL,
      status TEXT DEFAULT 'pending',
      note TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

export async function GET() {
  try {
    await ensureInvoicesTable();
    const result = await sql`SELECT * FROM invoices ORDER BY date DESC`;
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("Invoices GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInvoicesTable();
    const { projectId, invoiceNumber, date, dueDate, amount, status, note } =
      await req.json();
    const result = await sql`
      INSERT INTO invoices (project_id, invoice_number, date, due_date, amount, status, note)
      VALUES (${projectId}, ${invoiceNumber}, ${date}, ${dueDate || null}, ${amount}, ${status || "pending"}, ${note || ""})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Invoices POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
