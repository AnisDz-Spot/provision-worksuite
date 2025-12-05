import { NextResponse } from "next/server";

export async function POST() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "No database URL configured." },
      { status: 400 }
    );
  }

  try {
    const { execSync } = await import("child_process");

    // Step 1: Push the schema to create tables
    console.log("Pushing schema to database...");
    try {
      execSync("npx prisma db push --skip-generate", {
        stdio: "pipe",
        env: { ...process.env, DATABASE_URL: dbUrl },
      });
    } catch (pushError: any) {
      return NextResponse.json(
        {
          success: false,
          error: pushError?.message || "Failed to setup database.",
          stdout: pushError?.stdout?.toString(),
          stderr: pushError?.stderr?.toString(),
        },
        { status: 500 }
      );
    }

    // Step 2: Generate Prisma Client to match the new schema
    console.log("Generating Prisma Client...");
    try {
      execSync("npx prisma generate", {
        stdio: "pipe",
        env: { ...process.env, DATABASE_URL: dbUrl },
      });
    } catch (genError: any) {
      return NextResponse.json(
        {
          success: false,
          error: genError?.message || "Failed to generate Prisma client.",
          stdout: genError?.stdout?.toString(),
          stderr: genError?.stderr?.toString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database setup error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to setup database." },
      { status: 500 }
    );
  }
}
