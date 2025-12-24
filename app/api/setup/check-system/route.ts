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
        { status: 200 }
      );
    }

    // 2. Check Database Connectivity & Tables via Prisma
    // Optimization: Use Prisma directly to avoid opening a second connection pool with `checkTablesExist`
    let hasTables = false;
    let adminExists = false;

    try {
      const userCount = await prisma.user.count();
      hasTables = true;
      adminExists = userCount > 0;
    } catch (e: any) {
      // P2021 is "Table does not exist"
      if (
        e.code === "P2021" ||
        (e.message && e.message.includes("does not exist"))
      ) {
        hasTables = false;
      } else {
        throw e; // Rethrow connection errors to be caught by outer block
      }
    }

    // 5. Check optional Storage
    const storageProvider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;

    return NextResponse.json({
      ready: true,
      provider: storageProvider || "vercel-blob (default)",
      dbConfigured: true,
      hasTables,
      adminExists,
    });
  } catch (error: any) {
    log.error({ err: error }, "System check failed");
    return NextResponse.json(
      {
        ready: false,
        error: `Database connection failed: ${error.message}`,
        hasTables: false,
      },
      { status: 200 }
    );
  }
}
