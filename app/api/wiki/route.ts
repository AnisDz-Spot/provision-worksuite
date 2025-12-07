import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Wiki endpoint - Placeholder implementation
 *
 * Note: Wiki table is not in Prisma schema. This is an optional feature.
 * To enable: Add Wiki model to prisma/schema.prisma and run migrations.
 *
 * For now, returns empty data to prevent errors.
 */

export async function GET() {
  log.warn("Wiki feature not implemented - add to Prisma schema if needed");
  return NextResponse.json({
    success: true,
    data: [],
    message: "Wiki feature requires Prisma schema update",
  });
}

export async function POST(req: NextRequest) {
  log.warn("Wiki POST not implemented - add to Prisma schema if needed");
  return NextResponse.json(
    {
      success: false,
      error:
        "Wiki feature requires Prisma schema update. Add Wiki model to schema.prisma.",
    },
    { status: 501 }
  );
}
