"use client";

import { useEffect, useRef, useState } from "react";
import { JITSI_DOMAIN, getJitsiConfig } from "@/lib/meetings/jitsi-config";
import { Loader2, AlertCircle } from "lucide-react";

interface JitsiMeetingProps {
  roomId: string;
  userDisplayName: string;
  userEmail?: string;
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
  userEmail,
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
        const config = getJitsiConfig(roomId, userDisplayName, userEmail);
        config.parentNode = containerRef.current;

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, config);
        apiRef.current = api;

        // Event listeners
        api.addEventListener("videoConferenceJoined", () => {
          setIsLoading(false);
          initializingRef.current = false;
        });

        api.addEventListener("videoConferenceFailed", (details: any) => {
          console.error("Meeting failure:", details);
          setIsLoading(false);
          if (details.error === "conference.connectionError.membersOnly") {
            setError(
              "Access Denied: This room is restricted to members only or requires a moderator to start."
            );
          } else {
            setError(`Meeting failed: ${details.error || "Unknown error"}`);
          }
        });

        // FALLBACK: Hide loader after 5 seconds regardless of join event
        // This ensures the custom loader doesn't block Jitsi's own UI if events are delayed
        setTimeout(() => {
          if (initializingRef.current) {
            setIsLoading(false);
          }
        }, 5000);

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
      <div className="flex flex-col items-center justify-center h-full bg-background p-8 rounded-lg overflow-hidden">
        <div className="max-w-md w-full p-8 border-2 border-destructive/20 rounded-2xl bg-destructive/5 text-center shadow-lg">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-destructive mb-3">
            Connection Failed
          </h3>
          <p className="text-sm text-balance text-muted-foreground mb-8 leading-relaxed">
            {error}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all shadow-md active:scale-95"
            >
              Retry Connection
            </button>
            <div className="p-4 bg-muted/50 rounded-xl text-left border border-muted">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">
                Technical Guide
              </p>
              <p className="text-xs text-muted-foreground">
                If <code className="bg-muted px-1 rounded">meet.jit.si</code>{" "}
                remains restricted, try setting a community instance like
                <code className="bg-muted px-1 rounded ml-1">
                  meet.ffmuc.net
                </code>{" "}
                in your
                <code className="bg-muted px-1 rounded ml-1">.env</code> as
                <code className="bg-muted px-1 rounded ml-1 line-clamp-1 mt-1 block">
                  NEXT_PUBLIC_JITSI_DOMAIN=meet.ffmuc.net
                </code>
              </p>
            </div>
          </div>
        </div>
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
