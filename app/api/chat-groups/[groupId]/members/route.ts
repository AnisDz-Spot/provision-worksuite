import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await context.params;
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch the group to get its conversationId
    const chatGroup = await prisma.chatGroup.findUnique({
      where: { id: groupId },
      select: { conversationId: true },
    });

    if (!chatGroup || !chatGroup.conversationId) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // 2. Fetch conversation members
    const conversation = await prisma.conversation.findUnique({
      where: { id: chatGroup.conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                uid: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // 3. Verify user is a member
    const isMember = conversation.members.some(
      (m: any) => m.userId === user.uid
    );
    if (!isMember) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const members = conversation.members.map((m: any) => ({
      uid: m.user.uid,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatarUrl,
    }));

    return NextResponse.json({ success: true, members });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch group members");
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
