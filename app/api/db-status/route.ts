import { NextResponse } from "next/server";

/**
 * API endpoint to check database configuration status
 * SECURITY: Only checks server-side environment variables, never exposes credentials
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!dbUrl) {
    return NextResponse.json({ configured: false });
  }

  // Optional: Test connection
  try {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await client.end();

    return NextResponse.json({ configured: true });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json({ configured: false });
  }
}
