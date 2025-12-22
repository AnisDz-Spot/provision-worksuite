"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Dynamic import with SSR disabled - CRITICAL for Jitsi
const JitsiMeeting = dynamic(
  () =>
    import("@/components/meetings/JitsiMeeting").then((mod) => ({
      default: mod.JitsiMeeting,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading meeting...</p>
        </div>
      </div>
    ),
  }
);

interface MeetingRoomProps {
  roomId: string;
  userDisplayName: string;
  meetingTitle: string;
}

export function MeetingRoom({
  roomId,
  userDisplayName,
  meetingTitle,
}: MeetingRoomProps) {
  const router = useRouter();

  const handleMeetingEnd = () => {
    // Redirect to meetings list or dashboard
    router.push("/");
  };

  const handleLeave = () => {
    if (confirm("Are you sure you want to leave the meeting?")) {
      router.push("/");
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            title="Leave meeting"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-sm">{meetingTitle}</h1>
            <p className="text-xs text-muted-foreground">Video Conference</p>
          </div>
        </div>
      </div>

      {/* Jitsi Container */}
      <div className="flex-1 relative">
        <JitsiMeeting
          roomId={roomId}
          userDisplayName={userDisplayName}
          onMeetingEnd={handleMeetingEnd}
        />
      </div>
    </div>
  );
}
