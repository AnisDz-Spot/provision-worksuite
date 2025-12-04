import { NextResponse } from "next/server";

export async function POST() {
  // Only allow in development or for initial setup
  if (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test") {
    return NextResponse.json({ success: false, error: "Not allowed in production." }, { status: 403 });
  }

  try {
    // Dynamically import Prisma CLI to avoid bundling in production
    const { execSync } = await import("child_process");
    // Run prisma db push to sync schema
    execSync("npx prisma db push", { stdio: "inherit" });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to push schema." }, { status: 500 });
  }
}
