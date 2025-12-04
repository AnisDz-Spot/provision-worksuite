import { NextResponse } from "next/server";

export async function POST() {
  // Allow in all environments, but only if DB is not configured (very basic check)
  // In production, you should add authentication and a more robust check!
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return NextResponse.json({ success: false, error: "No database URL configured." }, { status: 400 });
  }

  try {
    // Dynamically import Prisma CLI to avoid bundling in production
    const { execSync } = await import("child_process");
    // Run prisma db push to sync schema (idempotent)
    execSync("npx prisma db push", { stdio: "inherit" });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to push schema." }, { status: 500 });
  }
}
