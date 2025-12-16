import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const presences = await prisma.presence.findMany({
      orderBy: { lastSeen: "desc" },
    });

    // Map to match frontend expectations
    const mappedPresences = presences.map(
      (p: { uid: string; status: string; lastSeen: Date }) => ({
        uid: p.uid,
        status: p.status,
        last_seen: p.lastSeen,
      })
    );

    log.info({ count: presences.length }, "Fetched presence data");

    return NextResponse.json({ success: true, data: mappedPresences });
  } catch (error) {
    log.error({ err: error }, "Presence GET error");
    return NextResponse.json(
      { success: false, error: "Failed to load presence" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, status } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "UID is required" },
        { status: 400 }
      );
    }

    const presence = await prisma.presence.upsert({
      where: { uid },
      update: {
        status: status || "available",
        lastSeen: new Date(),
      },
      create: {
        uid,
        status: status || "available",
      },
    });

    log.info({ uid, status: presence.status }, "Presence updated");

    return NextResponse.json({ success: true, data: presence });
  } catch (error) {
    log.error({ err: error }, "Presence update error");
    return NextResponse.json(
      { success: false, error: "Failed to update presence" },
      { status: 500 }
    );
  }
}
