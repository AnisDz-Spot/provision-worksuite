import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const { postgresUrl, dbType = "postgresql" } = await req.json();

    if (!postgresUrl) {
      return NextResponse.json(
        { error: "Missing connection string" },
        { status: 400 }
      );
    }

    // Basic security check on format based on database type
    const validFormats: Record<string, string[]> = {
      postgresql: ["postgres://", "postgresql://"],
      mysql: ["mysql://"],
      sqlite: ["file:", "sqlite:"],
    };

    const formats = validFormats[dbType] || validFormats.postgresql;
    const isValid = formats.some((format) => postgresUrl.startsWith(format));

    if (!isValid) {
      return NextResponse.json(
        { error: `Invalid connection string format for ${dbType}` },
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

    // Determine the appropriate env var name based on DB type
    const envVarNames: Record<string, string> = {
      postgresql: "POSTGRES_URL",
      mysql: "MYSQL_URL",
      sqlite: "SQLITE_URL",
    };
    const dbEnvVar = envVarNames[dbType] || "POSTGRES_URL";

    // Check if variable exists to replace or append
    if (envContent.includes(`${dbEnvVar}=`)) {
      envContent = envContent.replace(
        new RegExp(`${dbEnvVar}=.*`, "g"),
        `${dbEnvVar}="${postgresUrl}"`
      );
    } else {
      envContent += `\n${dbEnvVar}="${postgresUrl}"\n`;
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

    // Store dbType for reference
    if (envContent.includes("DB_TYPE=")) {
      envContent = envContent.replace(/DB_TYPE=.*/g, `DB_TYPE="${dbType}"`);
    } else {
      envContent += `\nDB_TYPE="${dbType}"\n`;
    }

    await fs.writeFile(envPath, envContent);

    // 2. Runtime Injection
    process.env[dbEnvVar] = postgresUrl;
    process.env.DATABASE_URL = postgresUrl;
    process.env.DB_TYPE = dbType;

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
