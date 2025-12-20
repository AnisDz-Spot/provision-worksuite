import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // In demo mode, return empty conversations
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({ success: true, data: [] });
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUser = searchParams.get("user");
  if (!targetUser) {
    return NextResponse.json(
      { success: false, error: "Missing user" },
      { status: 400 }
    );
  }

  // Enforce that the requester is the user whose conversations are being requested
  if (user.uid !== targetUser) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden: You can only view your own conversations",
      },
      { status: 403 }
    );
  }

  try {
    // Get all messages involving this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ fromUser: targetUser }, { toUser: targetUser }],
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Group by conversation partner and aggregate
    const conversationsMap = new Map<string, any>();

    for (const msg of messages) {
      const otherUser = msg.fromUser === targetUser ? msg.toUser : msg.fromUser;

      if (!conversationsMap.has(otherUser)) {
        conversationsMap.set(otherUser, {
          withUser: otherUser,
          unreadCount: 0,
          lastMessage: msg.message,
          lastTimestamp: msg.createdAt,
          isOnline: false,
        });
      }

      // Count unread messages to this user
      if (msg.toUser === targetUser && !msg.isRead) {
        const conv = conversationsMap.get(otherUser)!;
        conv.unreadCount++;
      }
    }

    // 4. Fetch presence and user details for all partners
    const partners = Array.from(conversationsMap.keys());
    if (partners.length > 0) {
      const [presenceArr, userArr] = await Promise.all([
        prisma.presence.findMany({
          where: { uid: { in: partners } },
        }),
        prisma.user.findMany({
          where: { uid: { in: partners } },
          select: { uid: true, name: true, avatarUrl: true },
        }),
      ]);

      // 5 minutes threshold for online
      const threshold = new Date(Date.now() - 5 * 60 * 1000);

      // Update with presence
      for (const p of presenceArr) {
        const conv = conversationsMap.get(p.uid);
        if (conv) {
          conv.isOnline =
            (p.status === "online" || p.status === "available") &&
            p.lastSeen >= threshold;
        }
      }

      // Update with user info
      for (const u of userArr) {
        const conv = conversationsMap.get(u.uid);
        if (conv) {
          conv.withUserName = u.name;
          conv.withUserAvatar = u.avatarUrl;
        }
      }
    }

    const data = Array.from(conversationsMap.values());

    log.info(
      { userId: targetUser, count: data.length },
      "Fetched conversations"
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    log.error({ err: error }, "Get conversations error");
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: [],
      },
      { status: 500 }
    );
  }
}
