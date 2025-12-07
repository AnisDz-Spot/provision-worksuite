import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const { postgresUrl } = await req.json();

    if (!postgresUrl) {
      return NextResponse.json(
        { error: "Missing connection string" },
        { status: 400 }
      );
    }

    // Basic security check on format
    if (
      !postgresUrl.startsWith("postgres://") &&
      !postgresUrl.startsWith("postgresql://")
    ) {
      return NextResponse.json(
        { error: "Invalid connection string format" },
        { status: 400 }
      );
    }

    // 1. Write to .env file
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";

    try {
      envContent = await fs.readFile(envPath, "utf-8");
    } catch (e) {
      // File doesn't exist, start new
    }

    // Check if variable exists to replace or append
    if (envContent.includes("POSTGRES_URL=")) {
      envContent = envContent.replace(
        /POSTGRES_URL=.*/g,
        `POSTGRES_URL="${postgresUrl}"`
      );
    } else {
      envContent += `\nPOSTGRES_URL="${postgresUrl}"\n`;
    }

    // Also set DATABASE_URL for Prisma
    if (envContent.includes("DATABASE_URL=")) {
      envContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL="${postgresUrl}"`
      );
    } else {
      envContent += `\nDATABASE_URL="${postgresUrl}"\n`;
    }

    await fs.writeFile(envPath, envContent);

    // 2. Runtime Injection
    // This allows the app to work immediately without restart (mostly)
    // Note: Prisma Client might need re-instantiation if it's already connected?
    // Usually Serverless functions spin up fresh, but long-running servers might hold stale config.
    // We explicitly set it here for the current process.
    process.env.POSTGRES_URL = postgresUrl;
    process.env.DATABASE_URL = postgresUrl;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to save config:", error);
    return NextResponse.json(
      {
        error:
          "Failed to write configuration file. Please ensure the server allows file writing or set Envrionment Variables manually.",
      },
      { status: 500 }
    );
  }
}
