"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Phone, PhoneOff, Video, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface CallInvite {
  id: string;
  roomId: string;
  callerUid: string;
  callerName: string;
  callerAvatar?: string;
}

interface CallRingingProps {
  invite: CallInvite;
  onClose: () => void;
}

export function CallRinging({ invite, onClose }: CallRingingProps) {
  const [isClosing, setIsClosing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Attempt to play ringing sound
    const audio = new Audio("/sounds/ringing.mp3");
    audio.loop = true;
    audioRef.current = audio;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch (e) {
        console.warn("Audio play blocked by browser. User interaction needed.");
      }
    };

    playAudio();

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const handleAction = async (status: "accepted" | "rejected") => {
    setIsClosing(true);
    try {
      if (status === "accepted") {
        window.open(`/meetings/${invite.roomId}`, "_blank");
      }

      await fetchWithCsrf("/api/meetings/invite-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: invite.id, status }),
      });
    } catch (e) {
      console.error("Failed to update invite status", e);
    } finally {
      onClose();
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-200 transition-all duration-500 transform ${isClosing ? "translate-y-20 opacity-0" : "translate-y-0 opacity-100"}`}
    >
      <Card className="w-80 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md overflow-hidden ring-1 ring-primary/10">
        <div className="p-1 bg-primary/10 animate-pulse" />
        <div className="p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20">
                <Image
                  src={
                    invite.callerAvatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${invite.callerUid}`
                  }
                  alt={invite.callerName}
                  width={56}
                  height={56}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm">
                <div className="bg-primary rounded-full p-1 animate-pulse">
                  <Video className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">
                Incoming Call
              </p>
              <h3 className="text-lg font-bold truncate">
                {invite.callerName}
              </h3>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="flex-1 gap-2 h-11"
              onClick={() => handleAction("rejected")}
            >
              <PhoneOff className="w-4 h-4" />
              Decline
            </Button>
            <Button
              className="flex-1 gap-2 h-11 bg-green-600 hover:bg-green-700 text-white border-0"
              onClick={() => handleAction("accepted")}
            >
              <Phone className="w-4 h-4" />
              Join
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
