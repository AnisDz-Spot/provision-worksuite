import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

import { shouldReturnMockData } from "@/lib/mock-helper";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  // In demo mode or for global admin, return success without database operation
  if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
    return NextResponse.json({
      success: true,
      data: {
        uid: user?.uid || "demo",
        status: "available",
        lastSeen: new Date(),
      },
      serverTime: new Date().toISOString(),
    });
  }

  try {
    const user = await getAuthenticatedUser();
    const body = await request.json();
    const { uid: bodyUid, status } = body || {};

    // Prioritize authenticated UID, fall back to body UID for backward compatibility/test cases
    const uid = user?.uid || bodyUid;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing uid" },
        { status: 400 }
      );
    }

    const stat = (
      typeof status === "string" && status ? status : "available"
    ).toLowerCase();

    console.log(
      `[Heartbeat] User ${uid} (auth: ${user?.uid || "none"}, body: ${bodyUid || "none"}) is active`
    );

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
    console.log(`[Heartbeat] Checking calls for recipientUid: ${uid}`);
    const pendingInvites = await prisma.callInvite.findMany({
      where: {
        recipientUid: uid,
        status: "pending",
        createdAt: {
          gte: new Date(Date.now() - 600000), // Show invites from last 10 minutes
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(
      `[Heartbeat] Found ${pendingInvites.length} pending calls for ${uid}`
    );

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
