"use client";

import { useEffect, useRef, useState } from "react";
import { JITSI_DOMAIN, getJitsiConfig } from "@/lib/meetings/jitsi-config";
import { Loader2, AlertCircle } from "lucide-react";

interface JitsiMeetingProps {
  roomId: string;
  userDisplayName: string;
  onMeetingEnd?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

/**
 * Jitsi Meeting Component
 *
 * SECURITY CONSTRAINTS:
 * - Client-only rendering (use client directive)
 * - Single initialization per room
 * - Proper cleanup on unmount
 * - No sensitive data logging
 */
export function JitsiMeeting({
  roomId,
  userDisplayName,
  onMeetingEnd,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const initializingRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard against multiple initializations
    if (initializingRef.current || apiRef.current) {
      return;
    }

    initializingRef.current = true;

    const loadJitsi = async () => {
      try {
        // Check if script already loaded
        if (window.JitsiMeetExternalAPI) {
          initializeJitsi();
          return;
        }

        // Load Jitsi script dynamically (client-only)
        const script = document.createElement("script");
        script.src = `https://${JITSI_DOMAIN}/external_api.js`;
        script.async = true;

        script.onload = () => {
          initializeJitsi();
        };

        script.onerror = () => {
          setError("Failed to load Jitsi Meet. Please check your connection.");
          setIsLoading(false);
          initializingRef.current = false;
        };

        document.body.appendChild(script);
      } catch (err) {
        console.error("Jitsi initialization error");
        setError("Failed to initialize meeting");
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    const initializeJitsi = () => {
      if (!containerRef.current || apiRef.current) {
        initializingRef.current = false;
        return;
      }

      try {
        const config = getJitsiConfig(roomId, userDisplayName);
        config.parentNode = containerRef.current;

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, config);
        apiRef.current = api;

        // Event listeners
        api.addEventListener("videoConferenceJoined", () => {
          setIsLoading(false);
          initializingRef.current = false;
        });

        api.addEventListener("readyToClose", () => {
          onMeetingEnd?.();
        });

        api.addEventListener("participantJoined", (participant: any) => {
          // No logging of participant details for privacy
          console.log("Participant joined");
        });

        api.addEventListener("participantLeft", (participant: any) => {
          console.log("Participant left");
        });

        api.addEventListener("errorOccurred", (error: any) => {
          console.error("Meeting error occurred");
          setError("An error occurred during the meeting");
        });
      } catch (err) {
        console.error("Jitsi API initialization error");
        setError("Failed to start meeting");
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    loadJitsi();

    // Cleanup function - CRITICAL for resource management
    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (err) {
          console.error("Error disposing Jitsi instance");
        }
        apiRef.current = null;
      }
      initializingRef.current = false;
    };
  }, [roomId, userDisplayName, onMeetingEnd]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-destructive/10 p-8 rounded-lg">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Meeting Error
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Connecting to meeting...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Please allow camera and microphone access
          </p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
