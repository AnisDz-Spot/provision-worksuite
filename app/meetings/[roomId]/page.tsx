import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MeetingRoom } from "./MeetingRoom";

export const dynamic = "force-dynamic";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  // SECURITY: Require authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/auth/login?redirect=/meetings/${roomId}`);
  }

  // SECURITY: Verify authorization before rendering Jitsi
  const meeting = await prisma.meeting.findUnique({
    where: { roomId },
    include: {
      participants: {
        where: { userId: user.uid },
      },
    },
  });

  // Check if meeting exists
  if (!meeting) {
    redirect("/unauthorized?reason=meeting-not-found");
  }

  // Check if meeting is active
  if (!meeting.isActive) {
    redirect("/unauthorized?reason=meeting-ended");
  }

  // Check if user is a participant
  if (meeting.participants.length === 0) {
    redirect("/unauthorized?reason=not-invited");
  }

  // All security checks passed - render meeting
  return (
    <MeetingRoom
      roomId={roomId}
      userDisplayName={user.name || user.email || "User"}
      meetingTitle={meeting.title}
    />
  );
}
