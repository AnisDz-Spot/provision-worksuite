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
    const { title, description, participantUids, type, conversationId } = body;

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

    // Create meeting with participants and invites in a transaction
    const { meeting, invites } = await prisma.$transaction(async (tx: any) => {
      const m = await tx.meeting.create({
        data: {
          roomId,
          title: title.trim(),
          description: description?.trim() || null,
          createdBy: user.uid,
          type: type || "video",
          conversationId: conversationId || null,
          participants: {
            create: [
              { userId: user.uid, role: "host" },
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

      // Create invitations for all recipients
      const invs = await Promise.all(
        uniqueParticipantUids.map((uid: string) =>
          tx.callInvite.create({
            data: {
              roomId,
              callerUid: user.uid,
              recipientUid: uid,
              status: "pending",
            },
          })
        )
      );

      return { meeting: m, invites: invs };
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
