import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Retrospectives endpoint - Placeholder implementation
 *
 * Note: Retrospectives table is not in Prisma schema. This is an optional feature.
 * To enable: Add Retrospective model to prisma/schema.prisma and run migrations.
 *
 * For now, returns empty data to prevent errors.
 */

export async function GET() {
  log.warn(
    "Retrospectives feature not implemented - add to Prisma schema if needed"
  );
  return NextResponse.json({
    success: true,
    data: [],
    message: "Retrospectives feature requires Prisma schema update",
  });
}

export async function POST(req: NextRequest) {
  log.warn(
    "Retrospectives POST not implemented - add to Prisma schema if needed"
  );
  return NextResponse.json(
    {
      success: false,
      error:
        "Retrospectives feature requires Prisma schema update. Add Retrospective model to schema.prisma.",
    },
    { status: 501 }
  );
}
