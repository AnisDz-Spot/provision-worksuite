import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { Message } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  let conversationId = searchParams.get("conversationId");
  let u1 = searchParams.get("user1");
  let u2 = searchParams.get("user2");

  // Normalize string "null" or "undefined" to null
  if (conversationId === "null" || conversationId === "undefined")
    conversationId = null;
  if (u1 === "null" || u1 === "undefined") u1 = null;
  if (u2 === "null" || u2 === "undefined") u2 = null;

  const isMasterAdmin =
    user.role === "Administrator" || user.role === "Master Admin";

  log.info(
    {
      conversationId,
      u1,
      u2,
      userId: user.uid,
      role: user.role,
      isMasterAdmin,
    },
    "Messages GET request"
  );

  try {
    let threadId = conversationId;

    // Legacy fallback: Find conversation by participants if ID not provided
    if (!threadId && u1 && u2) {
      // Permission check: Must be a participant OR Master Admin
      if (!isMasterAdmin && user.uid !== u1 && user.uid !== u2) {
        log.warn(
          { userId: user.uid, u1, u2 },
          "Forbidden message access attempt"
        );
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
            { members: { some: { userId: u1 || "" } } },
            { members: { some: { userId: u2 || "" } } },
          ],
        },
      });
      threadId = existing?.id || null;

      // If none exists and it's a direct chat, return empty list
      if (!threadId) {
        log.info({ u1, u2 }, "No existing conversation found, returning empty");
        return NextResponse.json({ success: true, data: [] });
      }
    }

    if (!threadId) {
      log.warn(
        { u1, u2, conversationId, hasU1: !!u1, hasU2: !!u2 },
        "Missing conversationId for request - failed fallback"
      );
      return NextResponse.json(
        { success: false, error: "Missing conversationId" },
        { status: 400 }
      );
    }

    const activeThreadId = threadId as string;

    // Verify membership (Skip for Master Admin)
    if (!isMasterAdmin) {
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
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: activeThreadId },
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

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    let { fromUser, toUser, message, conversationId } = body as {
      fromUser?: string;
      toUser?: string;
      message: string;
      conversationId?: string;
    };

    // Normalize string "null" or "undefined" to null/undefined
    if (conversationId === "null" || conversationId === "undefined")
      conversationId = undefined;
    if (fromUser === "null" || fromUser === "undefined") fromUser = undefined;
    if (toUser === "null" || toUser === "undefined") toUser = undefined;

    if (!message || (!conversationId && (!fromUser || !toUser))) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const isMasterAdmin =
      user.role === "Administrator" || user.role === "Master Admin";

    log.info(
      { conversationId, fromUser, toUser, userId: user.uid, role: user.role },
      "Messages POST request"
    );

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

    // 2. Verify membership (Skip for Master Admin)
    if (!isMasterAdmin) {
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

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  let conversationId = searchParams.get("conversationId");
  let u1 = searchParams.get("user1");
  let u2 = searchParams.get("user2");

  // Normalize
  if (conversationId === "null" || conversationId === "undefined")
    conversationId = null;
  if (u1 === "null" || u1 === "undefined") u1 = null;
  if (u2 === "null" || u2 === "undefined") u2 = null;

  log.info(
    { conversationId, u1, u2, userId: user.uid, role: user.role },
    "Messages DELETE request"
  );

  // Fallback: Find conversation by participants if ID not provided
  if (!conversationId && u1 && u2) {
    const isMasterAdmin = user.role === "Master Admin";

    // Permission check: Must be a participant OR Master Admin
    if (!isMasterAdmin && user.uid !== u1 && user.uid !== u2) {
      log.warn(
        { userId: user.uid, u1, u2 },
        "Forbidden message delete attempt"
      );
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 1. Try Direct Chat lookup
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
          { members: { some: { userId: u1 || "" } } },
          { members: { some: { userId: u2 || "" } } },
        ],
      },
    });
    conversationId = existing?.id || null;

    // 2. If not found, check if u2 is a Group ID
    if (!conversationId) {
      const group = await prisma.chatGroup.findUnique({
        where: { id: u2 },
      });
      if (group) {
        conversationId = group.conversationId;
        log.info(
          { groupId: u2, conversationId },
          "Found Group Conversation ID via fallback"
        );
      }
    }

    if (!conversationId) {
      log.info(
        { u1, u2 },
        "DELETE request: No conversation found to delete, returning success"
      );
      return NextResponse.json({
        success: true,
        message: "No conversation found",
      });
    }
  }

  if (!conversationId) {
    log.warn(
      { u1, u2, conversationId },
      "DELETE request: Missing conversationId after fallback"
    );
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
      user.role === "Master Admin" || user.role === "master_admin";
    const isAdminOrPM =
      user.role === "Administrator" ||
      user.role === "admin" ||
      user.role === "Project Manager" ||
      user.role === "project_manager";

    // 1. Check if it's a ChatGroup
    const linkedGroup = await prisma.chatGroup.findFirst({
      where: { conversationId: conversationId },
    });

    // Case 1: Master Admin - Hard Delete
    if (isMasterAdmin) {
      if (linkedGroup) {
        await prisma.chatGroup.delete({
          where: { id: linkedGroup.id },
        });
      }

      await prisma.conversation.delete({
        where: { id: conversationId },
      });

      log.info(
        { conversationId, deletedBy: user.uid, role: user.role },
        "Master Admin: Hard-deleted conversation and associated chat group"
      );
      return NextResponse.json({ success: true, action: "hard-delete" });
    }

    // Case 2: Admin or Project Manager - Global Archival
    if (isAdminOrPM && linkedGroup) {
      await prisma.chatGroup.update({
        where: { id: linkedGroup.id },
        data: { isArchived: true },
      });

      log.info(
        { conversationId, archivedBy: user.uid, role: user.role },
        "Admin/PM: Globally archived chat group"
      );
      return NextResponse.json({ success: true, action: "global-archive" });
    }

    // Case 3: Regular members or fallback - Private Archival / Leave Group
    if (linkedGroup) {
      const updatedMembers = linkedGroup.members.filter(
        (m: string) => m !== user.email
      );
      await prisma.chatGroup.update({
        where: { id: linkedGroup.id },
        data: { members: updatedMembers },
      });
    }

    // Archive conversation member record for the caller
    await prisma.conversationMember.updateMany({
      where: { conversationId: conversationId, userId: user.uid },
      data: { isArchived: true },
    });

    log.info(
      { conversationId, userId: user.uid, role: user.role },
      "Member: Private archival (left group/hidden from view)"
    );

    return NextResponse.json({ success: true, action: "private-archive" });
  } catch (error) {
    log.error({ err: error }, "Delete messages error");
    return NextResponse.json(
      { success: false, error: "Failed to delete messages" },
      { status: 500 }
    );
  }
}
