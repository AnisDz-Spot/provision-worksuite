import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { generateSecureRoomId } from "@/lib/meetings/room-generator";
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

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }
    const { title, description, participantUids } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    // Generate cryptographically secure room ID
    const roomId = generateSecureRoomId();

    // Deduplicate participant list
    const uniqueParticipantUids = Array.from(
      new Set(Array.isArray(participantUids) ? participantUids : [])
    ).filter((uid) => uid && typeof uid === "string" && uid !== user.uid);

    // Create meeting with participants
    const meeting = await prisma.meeting.create({
      data: {
        roomId,
        title: title.trim(),
        description: description?.trim() || null,
        createdBy: user.uid,
        participants: {
          create: [
            // Creator is always the host
            { userId: user.uid, role: "host" },
            // Add other participants
            ...uniqueParticipantUids.map((uid: string) => ({
              userId: uid,
              role: "participant",
            })),
          ],
        },
      },
      include: {
        participants: {
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

    log.info(
      { meetingId: meeting.id, roomId: meeting.roomId },
      "Meeting created"
    );

    return NextResponse.json({
      success: true,
      meeting: {
        id: meeting.id,
        roomId: meeting.roomId,
        title: meeting.title,
        description: meeting.description,
        participants: meeting.participants.map((p: any) => ({
          uid: p.user?.uid || "",
          name: p.user?.name || "User",
          role: p.role,
        })),
      },
    });
  } catch (error: unknown) {
    log.error({ err: error }, "Create meeting error");
    return NextResponse.json(
      { success: false, error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}
