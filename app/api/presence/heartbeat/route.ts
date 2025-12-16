import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // In demo mode, return success without database operation
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({
      success: true,
      data: { uid: "demo", status: "available", last_seen: new Date() },
    });
  }

  try {
    const body = await request.json();
    const { uid, status } = body || {};

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing uid" },
        { status: 400 }
      );
    }

    const stat = typeof status === "string" && status ? status : "available";

    // Upsert presence record
    const presence = await prisma.presence.upsert({
      where: { uid },
      update: {
        status: stat,
        lastSeen: new Date(),
      },
      create: {
        uid,
        status: stat,
      },
    });

    // Map to frontend expectations
    const mapped = {
      uid: presence.uid,
      status: presence.status,
      last_seen: presence.lastSeen,
    };

    log.debug({ uid, status: stat }, "Presence heartbeat");

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    log.error({ err: error }, "Presence heartbeat error");
    return NextResponse.json(
      { success: false, error: "Failed to update presence" },
      { status: 500 }
    );
  }
}
