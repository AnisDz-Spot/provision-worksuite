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
    // Fetches all conversations the user is a member of with a limit for performance
    const memberships = await prisma.conversationMember.findMany({
      where: {
        userId: user.uid,
        isArchived: false,
      },
      take: 50, // Keep it snappy
      orderBy: {
        conversation: {
          lastMessageAt: "desc",
        },
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

        // For group chats, we don't resolve an "other user" for the sidebar DM mapping
        const isDirect = conv.type === "direct";
        const otherMember = isDirect
          ? conv.members.find(
              (mem: { userId: string }) => mem.userId !== user.uid
            )
          : null;
        const otherUid = otherMember?.userId || (isDirect ? user.uid : "");

        // Fetch user details and presence only if it's a direct chat
        const [otherUserInfo, presence] =
          isDirect && otherUid
            ? await Promise.all([
                prisma.user.findUnique({
                  where: { uid: otherUid },
                  select: { name: true, avatarUrl: true },
                }),
                prisma.presence.findUnique({
                  where: { uid: otherUid },
                }),
              ])
            : [null, null];

        // Count unread messages in this conversation for the current user
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            toUser: user.uid,
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
          withUser: isDirect ? otherUid : conv.id,
          withUserName: isDirect
            ? otherUserInfo?.name || otherUid
            : conv.name || "Group",
          withUserAvatar: isDirect ? otherUserInfo?.avatarUrl || "" : "",
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
