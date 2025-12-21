import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { Message } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const u1 = searchParams.get("user1");
  const u2 = searchParams.get("user2");

  try {
    let threadId = conversationId;

    // Legacy fallback: Find conversation by participants if ID not provided
    if (!threadId && u1 && u2) {
      if (user.uid !== u1 && user.uid !== u2) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      const existing = await prisma.conversation.findFirst({
        where: {
          type: "direct",
          members: {
            every: {
              userId: { in: [u1, u2] },
            },
          },
          // Ensure it only has exactly these two members
          AND: [
            { members: { some: { userId: u1 } } },
            { members: { some: { userId: u2 } } },
          ],
        },
      });
      threadId = existing?.id || null;

      // If none exists and it's a direct chat, we might need to return empty
      if (!threadId) {
        return NextResponse.json({ success: true, data: [] });
      }
    }

    if (!threadId) {
      return NextResponse.json(
        { success: false, error: "Missing conversationId" },
        { status: 400 }
      );
    }

    const activeThreadId = threadId as string;

    // Verify membership
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: activeThreadId,
          userId: user.uid,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not a member" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: threadId },
      orderBy: { createdAt: "asc" },
    });

    const mappedMessages = messages.map((msg: Message) => ({
      id: String(msg.id),
      from_user: msg.fromUser,
      to_user: msg.toUser,
      message: msg.message,
      created_at: msg.createdAt,
      is_read: msg.isRead,
      conversationId: msg.conversationId || undefined,
    }));

    return NextResponse.json({ success: true, data: mappedMessages });
  } catch (error) {
    log.error({ err: error }, "Get thread error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

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
    const { fromUser, toUser, message, conversationId } = body as {
      fromUser?: string;
      toUser?: string;
      message: string;
      conversationId?: string;
    };

    if (!message || (!conversationId && (!fromUser || !toUser))) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    let targetConvId = conversationId;

    // 1. Find or Create conversation if not provided
    if (!targetConvId && fromUser && toUser) {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "direct",
          AND: [
            { members: { some: { userId: fromUser } } },
            { members: { some: { userId: toUser } } },
          ],
          members: {
            every: {
              userId: { in: [fromUser, toUser] },
            },
          },
        },
      });

      if (existing) {
        targetConvId = existing.id;
      } else {
        const newConv = await prisma.conversation.create({
          data: {
            type: "direct",
            members: {
              create: [{ userId: fromUser }, { userId: toUser }],
            },
          },
        });
        targetConvId = newConv.id;
      }
    }

    const finalConvId = targetConvId as string;

    // 2. Verify membership (for provided conversationId)
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: finalConvId,
          userId: user.uid,
        },
      },
    });

    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not a member" },
        { status: 403 }
      );
    }

    // 3. Create message
    const newMessage = await prisma.message.create({
      data: {
        fromUser: user.uid,
        toUser: toUser || null, // Optional in modern
        message,
        conversationId: targetConvId,
      },
    });

    // 4. Update conversation timestamp
    await prisma.conversation.update({
      where: { id: finalConvId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(newMessage.id),
        from_user: newMessage.fromUser,
        to_user: newMessage.toUser,
        message: newMessage.message,
        created_at: newMessage.createdAt,
        is_read: newMessage.isRead,
        conversationId: newMessage.conversationId || undefined,
      },
    });
  } catch (error) {
    log.error({ err: error }, "Send message error");
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  let conversationId = searchParams.get("conversationId");
  const u1 = searchParams.get("user1");
  const u2 = searchParams.get("user2");

  // Fallback: Find conversation by participants if ID not provided
  if (!conversationId && u1 && u2) {
    if (user.uid !== u1 && user.uid !== u2) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: "direct",
        members: {
          every: {
            userId: { in: [u1, u2] },
          },
        },
        AND: [
          { members: { some: { userId: u1 } } },
          { members: { some: { userId: u2 } } },
        ],
      },
    });
    conversationId = existing?.id || null;
  }

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: "Missing conversationId" },
      { status: 400 }
    );
  }

  try {
    // Check if requester is a member OR is a Master Admin/Global Admin
    const isMember = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conversationId,
          userId: user.uid,
        },
      },
    });

    const isMasterAdmin =
      user.role === "Administrator" || user.role === "Master Admin";

    // Allow if member OR master admin
    if (!isMember && !isMasterAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Soft-Delete: Mark as archived for ALL members instead of deleting
    await prisma.conversationMember.updateMany({
      where: { conversationId: conversationId },
      data: { isArchived: true },
    });

    log.info(
      { conversationId, deletedBy: user.uid },
      "Soft-deleted (archived) conversation thread"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error }, "Delete messages error");
    return NextResponse.json(
      { success: false, error: "Failed to delete messages" },
      { status: 500 }
    );
  }
}
