import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return NextResponse.json({ configured: !!dbUrl });
}
