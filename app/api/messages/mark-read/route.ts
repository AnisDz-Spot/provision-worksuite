import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentUser, otherUser } = body || {};

    if (!currentUser || !otherUser) {
      return NextResponse.json(
        { success: false, error: "Missing users" },
        { status: 400 }
      );
    }

    // Mark all unread messages from otherUser to currentUser as read
    const result = await prisma.message.updateMany({
      where: {
        toUser: currentUser,
        fromUser: otherUser,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    log.info(
      { currentUser, otherUser, count: result.count },
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
