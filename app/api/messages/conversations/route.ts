import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { shouldUseDatabaseData } from "@/lib/dataSource";

// Define explicit interfaces for the specific query results
interface ConversationWithDetails {
  id: string;
  type: string;
  name: string | null;
  lastMessageAt: Date;
  updatedAt: Date;
  members: { userId: string }[];
  messages: { message: string; createdAt: Date }[];
}

interface MembershipWithConversation {
  conversation: ConversationWithDetails;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  try {
    // 0. Lazy Migration: consolidate orphan messages into conversations
    const orphanMessages = await prisma.message.findMany({
      where: {
        conversationId: null,
        OR: [{ fromUser: user.uid }, { toUser: user.uid }],
      },
    });

    if (orphanMessages.length > 0) {
      log.info(
        { userId: user.uid, count: orphanMessages.length },
        "Migrating orphan messages"
      );

      const pairs = new Map<string, any[]>();
      for (const msg of orphanMessages) {
        if (!msg.fromUser || !msg.toUser) continue;
        const pair = [msg.fromUser, msg.toUser].sort().join(":");
        if (!pairs.has(pair)) pairs.set(pair, []);
        pairs.get(pair)!.push(msg);
      }

      for (const [pair, msgs] of pairs.entries()) {
        const [u1, u2] = pair.split(":");
        let conv = await prisma.conversation.findFirst({
          where: {
            type: "direct",
            members: { some: { userId: u1 } },
            AND: { members: { some: { userId: u2 } } },
          },
        });

        if (!conv) {
          conv = await prisma.conversation.create({
            data: {
              type: "direct",
              members: {
                create: [{ userId: u1 }, { userId: u2 }],
              },
            },
          });
        }

        await prisma.message.updateMany({
          where: { id: { in: msgs.map((m) => m.id) } },
          data: { conversationId: conv.id },
        });
      }
    }

    // 1. Fetch all conversations the user is a member of
    const memberships = await prisma.conversationMember.findMany({
      where: {
        userId: user.uid,
        isArchived: false,
      },
      include: {
        conversation: {
          include: {
            members: true,
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    // 2. Map memberships to UI-friendly conversation objects
    const conversations = await Promise.all(
      memberships.map(async (m: MembershipWithConversation) => {
        const conv = m.conversation;
        const lastMsg = conv.messages[0];

        // Find the "other" user for direct chats
        const otherMember = conv.members.find(
          (mem: { userId: string }) => mem.userId !== user.uid
        );
        const otherUid = otherMember?.userId || user.uid; // Fallback to self for notes

        // Fetch user details and presence for the other user
        const [otherUserInfo, presence] = await Promise.all([
          prisma.user.findUnique({
            where: { uid: otherUid },
            select: { name: true, avatarUrl: true },
          }),
          prisma.presence.findUnique({
            where: { uid: otherUid },
          }),
        ]);

        // Count unread messages in this conversation for the current user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            toUser: user.uid, // Legacy field check or use isRead per user etc.
            isRead: false,
          },
        });

        // 5 minutes threshold for online
        const threshold = new Date(Date.now() - 5 * 60 * 1000);
        const isOnline =
          presence &&
          (presence.status === "online" || presence.status === "available") &&
          presence.lastSeen >= threshold;

        return {
          id: conv.id,
          withUser: otherUid,
          withUserName: otherUserInfo?.name || otherUid,
          withUserAvatar: otherUserInfo?.avatarUrl || "",
          unreadCount,
          lastMessage: lastMsg?.message || "",
          lastTimestamp: lastMsg?.createdAt || conv.updatedAt,
          isOnline: !!isOnline,
          type: conv.type,
          name: conv.name,
        };
      })
    );

    // Sort by last activity
    conversations.sort(
      (a, b) =>
        new Date(b.lastTimestamp).getTime() -
        new Date(a.lastTimestamp).getTime()
    );

    log.info(
      { userId: user.uid, count: conversations.length },
      "Fetched conversations (Modern)"
    );

    return NextResponse.json({ success: true, data: conversations });
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
