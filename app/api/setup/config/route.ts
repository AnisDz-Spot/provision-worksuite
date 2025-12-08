import { NextResponse } from "next/server";
import { saveSetting } from "@/lib/config/settings-db";
import { invalidateConfigCache } from "@/lib/config/loader";

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

    // 1. Save to Database (Encrypted System Settings)
    // This persists the config for future sessions/restarts
    let savedToDB = false;
    let dbWarning = null;

    try {
      if (postgresUrl) {
        // Validation of postgresUrl is already done above
        await saveSetting("db_connection_string", postgresUrl, true);
        await saveSetting("app_mode", "live", false); // "live" mode
        savedToDB = true;
      }
    } catch (dbError: any) {
      console.error("Failed to save settings to DB:", dbError);
      // Fallback: If DB save fails (e.g. table doesn't exist yet), we proceed with runtime injection
      dbWarning =
        "Configuration active for session only. Could not persist to database (Bootstrap connection issue or table missing).";
    }

    // 2. Runtime Injection (Always do this)
    process.env.POSTGRES_URL = postgresUrl;
    process.env.DATABASE_URL = postgresUrl;
    process.env.DB_TYPE = dbType;

    // Invalidate loader cache
    invalidateConfigCache();

    return NextResponse.json({
      success: true,
      savedToDB,
      warning: dbWarning,
      message: savedToDB
        ? "Configuration saved to database."
        : "Configuration active for session.",
    });
  } catch (error: any) {
    console.error("Failed to configure database:", error);
    return NextResponse.json(
      {
        error: error.message || "Unknown error during configuration",
      },
      { status: 500 }
    );
  }
}
