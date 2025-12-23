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
      data: { uid: "demo", status: "available", lastSeen: new Date() },
      serverTime: new Date().toISOString(),
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

    const stat = (
      typeof status === "string" && status ? status : "available"
    ).toLowerCase();

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
      lastSeen: presence.lastSeen,
    };

    // Find pending call invites for this user
    const pendingInvites = await prisma.callInvite.findMany({
      where: {
        recipientUid: uid,
        status: "pending",
        createdAt: {
          gte: new Date(Date.now() - 60000), // Only show invites from last 60 seconds
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Resolve caller identities
    const enhancedInvites = await Promise.all(
      pendingInvites.map(async (invite: any) => {
        const caller = await prisma.user.findUnique({
          where: { uid: invite.callerUid },
          select: { name: true, avatarUrl: true },
        });
        return {
          ...invite,
          callerName: caller?.name || "Someone",
          callerAvatar: caller?.avatarUrl,
        };
      })
    );

    log.debug(
      { uid, status: stat, pendingCount: enhancedInvites.length },
      "Presence heartbeat"
    );

    return NextResponse.json({
      success: true,
      data: mapped,
      pendingCalls: enhancedInvites,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    log.error({ err: error }, "Presence heartbeat error");
    return NextResponse.json(
      { success: false, error: "Failed to update presence" },
      { status: 500 }
    );
  }
}
