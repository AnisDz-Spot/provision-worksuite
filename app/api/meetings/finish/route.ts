import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roomId } = body;

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 }
      );
    }

    // 1. Find the meeting
    const meeting = await prisma.meeting.findUnique({
      where: { roomId },
      include: {
        participants: true,
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Meeting not found" },
        { status: 404 }
      );
    }

    // Only allow host or participants to finish
    const isParticipant = meeting.participants.some(
      (p: any) => p.userId === user.uid
    );
    if (!isParticipant) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 2. Update meeting status if still active
    const now = new Date();
    let updatedMeeting = meeting;

    if (meeting.isActive) {
      updatedMeeting = await prisma.meeting.update({
        where: { roomId },
        data: {
          isActive: false,
          endTime: now,
        },
      });

      // 3. Post chat log if linked to a conversation
      if (meeting.conversationId) {
        const startTime = meeting.startTime || meeting.createdAt;
        const durationMs = now.getTime() - startTime.getTime();

        // Format duration (e.g. 1m 30s)
        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const hours = Math.floor((durationMs / (1000 * 60 * 60)) % 24);

        let durationStr = "";
        if (hours > 0) durationStr += `${hours}h `;
        if (minutes > 0 || hours > 0) durationStr += `${minutes}m `;
        durationStr += `${seconds}s`;

        const callTypeLabel =
          meeting.type === "audio" ? "Audio Call" : "Video Call";
        const messageText = `📞 ${callTypeLabel} - ${durationStr}`;

        await prisma.message.create({
          data: {
            fromUser: user.uid,
            message: messageText,
            conversationId: meeting.conversationId,
            isRead: false,
          },
        });

        // Update conversation lastMessageAt
        await prisma.conversation.update({
          where: { id: meeting.conversationId },
          data: { lastMessageAt: now },
        });
      }
    }

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
    });
  } catch (error: unknown) {
    log.error({ err: error }, "Finish meeting error");
    return NextResponse.json(
      { success: false, error: "Failed to finish meeting" },
      { status: 500 }
    );
  }
}
