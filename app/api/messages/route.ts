import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

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
  const u1 = searchParams.get("user1");
  const u2 = searchParams.get("user2");

  if (!u1 || !u2) {
    return NextResponse.json(
      { success: false, error: "Missing user1 or user2" },
      { status: 400 }
    );
  }

  // Enforce that the requester is one of the participants
  if (user.uid !== u1 && user.uid !== u2) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUser: u1, toUser: u2 },
          { fromUser: u2, toUser: u1 },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Map to match frontend expectations
    const mappedMessages = messages.map((msg) => ({
      id: msg.id,
      from_user: msg.fromUser,
      to_user: msg.toUser,
      message: msg.message,
      created_at: msg.createdAt,
      is_read: msg.isRead,
    }));

    log.info(
      { user1: u1, user2: u2, count: messages.length },
      "Fetched message thread"
    );

    return NextResponse.json({ success: true, data: mappedMessages });
  } catch (error) {
    log.error({ err: error }, "Get thread error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages", data: [] },
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
    const { fromUser, toUser, message } = body || {};
    if (!fromUser || !toUser || !message) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    // Enforce that the sender is the authenticated user
    if (user.uid !== fromUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You can only send messages as yourself",
        },
        { status: 403 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        fromUser,
        toUser,
        message,
      },
    });

    // Map to match frontend expectations
    const mappedMessage = {
      id: newMessage.id,
      from_user: newMessage.fromUser,
      to_user: newMessage.toUser,
      message: newMessage.message,
      created_at: newMessage.createdAt,
      is_read: newMessage.isRead,
    };

    log.info({ from: fromUser, to: toUser }, "Message sent");

    return NextResponse.json({ success: true, data: mappedMessage });
  } catch (error) {
    log.error({ err: error }, "Send message error");
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
