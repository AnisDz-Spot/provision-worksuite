"use client";

import { useEffect, useRef, useState } from "react";
import { getZegoConfig } from "@/lib/meetings/zego-config";
import { Loader2, AlertCircle } from "lucide-react";

interface ZegoMeetingProps {
  roomId: string;
  userId: string;
  userName: string;
  onMeetingEnd?: () => void;
  zegoAppId?: number | null;
  zegoServerSecret?: string | null;
}

/**
 * ZegoCloud Meeting Component
 *
 * Provides a managed, premium video call experience using ZegoCloud UIKit.
 * Zero-configuration required for end-clients once developer keys are set.
 */
export function ZegoMeeting({
  roomId,
  userId,
  userName,
  onMeetingEnd,
  zegoAppId,
  zegoServerSecret,
}: ZegoMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initMeeting = async () => {
      if (!containerRef.current) return;

      try {
        const { ZegoUIKitPrebuilt } =
          await import("@zegocloud/zego-uikit-prebuilt");
        const config = getZegoConfig(roomId, userId, userName, {
          appID: zegoAppId,
          serverSecret: zegoServerSecret,
        });

        if (!config.appID || !config.serverSecret) {
          console.error("ZegoCloud Config Missing:", {
            appID: !!config.appID,
            secret: !!config.serverSecret,
            rawAppID: process.env.NEXT_PUBLIC_ZEGO_APP_ID,
          });
          setError(
            "ZegoCloud is not properly configured. Please check environment variables (and restart your dev server)."
          );
          setIsLoading(false);
          return;
        }

        // Generate Kit Token
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          config.appID,
          config.serverSecret,
          config.roomID,
          config.userID,
          config.userName
        );

        // Create instance
        const zp = ZegoUIKitPrebuilt.create(kitToken);

        // Join room with UI configuration
        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: "Personal link",
              url: window.location.origin + window.location.pathname,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          showScreenSharingButton: true,
          showUserList: true,
          showPreJoinView: false, // Direct join for better UX
          onLeaveRoom: () => {
            onMeetingEnd?.();
          },
        });

        setIsLoading(false);
      } catch (err) {
        console.error("ZegoCloud initialization error:", err);
        setError("Failed to initialize video call. Please try again.");
        setIsLoading(false);
      }
    };

    initMeeting();

    return () => {
      // Cleanup is handled by the SDK internally when container is unmounted
    };
  }, [roomId, userId, userName, onMeetingEnd]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-background p-8 rounded-lg">
        <div className="max-w-md w-full p-8 border-2 border-destructive/20 rounded-2xl bg-destructive/5 text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-destructive mb-3">
            Connection failed
          </h3>
          <p className="text-sm text-balance text-muted-foreground mb-8 leading-relaxed">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">
            Securing connection...
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Preparing your video workspace
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full [&_iframe]:border-0!"
        style={{ height: "100%" }}
      />
    </div>
  );
}
