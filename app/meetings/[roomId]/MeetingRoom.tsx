"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Dynamic import with SSR disabled - CRITICAL for WebRTC
const ZegoMeeting = dynamic(
  () =>
    import("@/components/meetings/ZegoMeeting").then((mod) => ({
      default: mod.ZegoMeeting,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-background/50 backdrop-blur-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">
            Initializing camera...
          </p>
        </div>
      </div>
    ),
  }
);

interface MeetingRoomProps {
  roomId: string;
  userId: string;
  userDisplayName: string;
  userEmail?: string;
  meetingTitle: string;
}

export function MeetingRoom({
  roomId,
  userId,
  userDisplayName,
  userEmail,
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
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLeave}
            className="p-2 hover:bg-accent rounded-xl transition-all active:scale-95"
            title="Leave meeting"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-sm tracking-tight">{meetingTitle}</h1>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Managed Video Conference
            </p>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-neutral-950">
        <ZegoMeeting
          roomId={roomId}
          userId={userId}
          userName={userDisplayName}
          onMeetingEnd={handleMeetingEnd}
        />
      </div>
    </div>
  );
}
