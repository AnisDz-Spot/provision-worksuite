import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Check Environment Variables - support multiple DB types
    const dbUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.MYSQL_URL ||
      process.env.SQLITE_URL;

    if (!dbUrl) {
      return NextResponse.json(
        {
          ready: false,
          error:
            "Database environment variable is missing. Configure your database connection.",
        },
        { status: 200 } // Return 200 so UI can handle it gracefully as "not ready"
      );
    }

    // 2. Check Database Connectivity
    await prisma.$connect();

    // 3. Check optional Storage (just existence)
    const storageProvider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;

    return NextResponse.json({
      ready: true,
      provider: storageProvider || "vercel-blob (default)",
      dbConfigured: true,
    });
  } catch (error: any) {
    log.error({ err: error }, "System check failed");
    return NextResponse.json(
      {
        ready: false,
        error: `Database connection failed: ${error.message}`,
      },
      { status: 200 }
    );
  }
}
