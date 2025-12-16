import { NextResponse } from "next/server";
import { saveSetting } from "@/lib/config/settings-db";
import { invalidateConfigCache } from "@/lib/config/loader";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export async function POST(req: Request) {
  // SECURITY: Require global-admin authentication to modify database configuration
  const currentUser = await getAuthenticatedUser();
  if (!currentUser || currentUser.role !== "global-admin") {
    return NextResponse.json(
      {
        error: currentUser
          ? "Forbidden: Global admin access required"
          : "Unauthorized",
      },
      { status: currentUser ? 403 : 401 }
    );
  }

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
      log.error({ err: dbError }, "Failed to save settings to DB");
      // Fallback: If DB save fails (e.g. table doesn't exist yet), we proceed with runtime injection
      dbWarning =
        "Configuration active for session only. Could not persist to database (Bootstrap connection issue or table missing).";
    }

    // 2. Runtime Injection (Temporary - only for current session)
    // NOTE: These mutations are NOT persistent and will be lost on server restart.
    // The database-stored configuration (above) is loaded on startup via lib/config/loader.ts
    // This runtime injection is only a fallback to make the current session work
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
    log.error({ err: error }, "Failed to configure database");
    return NextResponse.json(
      {
        error: error.message || "Unknown error during configuration",
      },
      { status: 500 }
    );
  }
}
