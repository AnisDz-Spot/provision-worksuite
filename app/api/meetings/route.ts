import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Meetings endpoint - Placeholder implementation
 *
 * Note: Meetings table is not in Prisma schema. This is an optional feature.
 * To enable: Add Meeting model to prisma/schema.prisma and run migrations.
 *
 * For now, returns empty data to prevent errors.
 */

export async function GET() {
  log.warn("Meetings feature not implemented - add to Prisma schema if needed");
  return NextResponse.json({
    success: true,
    data: [],
    message: "Meetings feature requires Prisma schema update",
  });
}

export async function POST(req: NextRequest) {
  log.warn("Meetings POST not implemented - add to Prisma schema if needed");
  return NextResponse.json(
    {
      success: false,
      error:
        "Meetings feature requires Prisma schema update. Add Meeting model to schema.prisma.",
    },
    { status: 501 }
  );
}
