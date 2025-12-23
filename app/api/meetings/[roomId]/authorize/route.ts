import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params;
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, authorized: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find meeting and check if user is a participant
    const meeting = await prisma.meeting.findUnique({
      where: { roomId },
      include: {
        participants: {
          where: { userId: user.uid },
        },
        creator: {
          select: {
            uid: true,
            name: true,
          },
        },
      },
    });

    if (!meeting) {
      log.warn({ roomId, userId: user.uid }, "Meeting not found");
      return NextResponse.json(
        { success: false, authorized: false, error: "Meeting not found" },
        { status: 404 }
      );
    }

    if (!meeting.isActive) {
      log.warn({ roomId, userId: user.uid }, "Meeting is not active");
      return NextResponse.json(
        { success: false, authorized: false, error: "Meeting is not active" },
        { status: 403 }
      );
    }

    const isParticipant = meeting.participants.length > 0;

    if (!isParticipant) {
      log.warn({ roomId, userId: user.uid }, "User not authorized for meeting");
      return NextResponse.json(
        {
          success: false,
          authorized: false,
          error: "Not authorized to join this meeting",
        },
        { status: 403 }
      );
    }

    // Update joinedAt timestamp and meeting startTime if not set
    await prisma.$transaction([
      prisma.meetingParticipant.updateMany({
        where: {
          meetingId: meeting.id,
          userId: user.uid,
        },
        data: {
          joinedAt: new Date(),
        },
      }),
      ...(meeting.startTime === null
        ? [
            prisma.meeting.update({
              where: { id: meeting.id },
              data: { startTime: new Date() },
            }),
          ]
        : []),
    ]);

    log.info({ roomId, userId: user.uid }, "User authorized for meeting");

    return NextResponse.json({
      success: true,
      authorized: true,
      meeting: {
        id: meeting.id,
        roomId: meeting.roomId,
        title: meeting.title,
        description: meeting.description,
        createdBy: meeting.creator.name,
        userRole: meeting.participants[0].role,
      },
    });
  } catch (error: unknown) {
    log.error({ err: error }, "Authorize meeting error");
    return NextResponse.json(
      {
        success: false,
        authorized: false,
        error: "Failed to authorize meeting access",
      },
      { status: 500 }
    );
  }
}
