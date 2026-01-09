import prisma from "@/lib/prisma";
import { sendMeetingInvitationEmail } from "@/lib/email";
import { log } from "@/lib/logger";

/**
 * Handle meeting notifications when participants are added
 */
export async function handleMeetingNotifications(
  meetingId: string,
  newParticipantUids: string[],
  baseUrl: string
) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        creator: true,
      },
    });

    if (!meeting) return;

    // Get details for all new participants
    // Participants can be internal (UID) or external (email string in attendees array)
    // Here we focus on internal participants for system notifications
    const internalParticipants = await prisma.user.findMany({
      where: {
        uid: { in: newParticipantUids },
      },
    });

    const meetingUrl = `${baseUrl}/meetings?id=${meeting.id}`;

    for (const user of internalParticipants) {
      // 1. Create In-App Notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "meeting_invitation",
          title: "New Meeting Invitation",
          message: `You've been invited to: ${meeting.title}`,
          link: meetingUrl,
        },
      });

      // 2. Send Email
      if (user.email) {
        await sendMeetingInvitationEmail(
          user.email,
          meeting.title,
          meeting.date?.toISOString() ||
            meeting.startTime?.toISOString() ||
            new Date().toISOString(),
          meetingUrl
        );
      }
    }

    // Handle External Attendees (Custom Attendees)
    // These are stored in meeting.attendees as "Name <email@example.com>" or just "email@example.com"
    const externalEmails = newParticipantUids.filter(
      (uid) =>
        !internalParticipants.some((u: any) => u.uid === uid) &&
        uid.includes("@")
    );

    for (const emailEntry of externalEmails) {
      const email = emailEntry.includes("<")
        ? emailEntry.split("<")[1].replace(">", "").trim()
        : emailEntry.trim();

      const name = emailEntry.includes("<")
        ? emailEntry.split("<")[0].trim()
        : "Guest";

      await sendMeetingInvitationEmail(
        email,
        meeting.title,
        meeting.date?.toISOString() ||
          meeting.startTime?.toISOString() ||
          new Date().toISOString(),
        meetingUrl
      );
    }

    log.info(
      { meetingId, participantCount: newParticipantUids.length },
      "Meeting notifications processed"
    );
  } catch (error) {
    log.error({ error, meetingId }, "Failed to process meeting notifications");
  }
}
