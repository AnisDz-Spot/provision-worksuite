import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { currentUser, otherUser, conversationId } = body || {};

    // Validate that currentUser matches the authenticated user (if provided)
    // or just use user.uid directly.
    const readerUid = user.uid;

    if (!conversationId && !otherUser) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let targetConvId = conversationId;

    // Legacy fallback: Find conversation by participants
    if (!targetConvId && otherUser) {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "direct",
          members: {
            every: { userId: { in: [readerUid, otherUser] } },
          },
          AND: [
            { members: { some: { userId: readerUid } } },
            { members: { some: { userId: otherUser } } },
          ],
        },
      });
      targetConvId = existing?.id;
    }

    if (!targetConvId) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Mark all unread messages in this conversation for this user as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId: targetConvId,
        toUser: readerUid,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    log.info(
      {
        readerUid,
        otherUser,
        conversationId: targetConvId,
        count: result.count,
      },
      "Messages marked as read"
    );

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    log.error({ err: error }, "Mark read error");
    return NextResponse.json(
      { success: false, error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}
