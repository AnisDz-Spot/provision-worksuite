/**
 * Jitsi Meet Configuration
 * Environment-based configuration for Jitsi integration
 */

export const JITSI_DOMAIN =
  process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

export interface JitsiConfig {
  roomName: string;
  width: string;
  height: string;
  parentNode?: HTMLElement;
  configOverwrite: {
    startWithAudioMuted: boolean;
    startWithVideoMuted: boolean;
    enableWelcomePage: boolean;
    prejoinPageEnabled: boolean;
    disableDeepLinking: boolean;
    fileRecordingsEnabled: boolean;
    liveStreamingEnabled: boolean;
    transcribingEnabled: boolean;
    disableThirdPartyRequests: boolean;
    doNotStoreRoom: boolean;
    resolution: number;
    constraints: {
      video: {
        height: { ideal: number; max: number; min: number };
      };
    };
  };
  interfaceConfigOverwrite: {
    TOOLBAR_BUTTONS: string[];
    SHOW_JITSI_WATERMARK: boolean;
    SHOW_WATERMARK_FOR_GUESTS: boolean;
    DISABLE_VIDEO_BACKGROUND: boolean;
    MOBILE_APP_PROMO: boolean;
  };
  userInfo: {
    displayName: string;
  };
}

/**
 * Get Jitsi configuration for a meeting
 * @param roomName - The secure room ID
 * @param userDisplayName - User's display name
 * @returns Jitsi configuration object
 */
export function getJitsiConfig(
  roomName: string,
  userDisplayName: string
): JitsiConfig {
  return {
    roomName,
    width: "100%",
    height: "100%",
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      enableWelcomePage: false,
      prejoinPageEnabled: true,
      disableDeepLinking: true,

      // Security: Disable features by default
      fileRecordingsEnabled: false,
      liveStreamingEnabled: false,
      transcribingEnabled: false,

      // Privacy
      disableThirdPartyRequests: true,
      doNotStoreRoom: true,

      // Performance
      resolution: 720,
      constraints: {
        video: {
          height: { ideal: 720, max: 720, min: 360 },
        },
      },
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        "microphone",
        "camera",
        "closedcaptions",
        "desktop",
        "fullscreen",
        "fodeviceselection",
        "hangup",
        "chat",
        "raisehand",
        "videoquality",
        "tileview",
        "settings",
      ],
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      DISABLE_VIDEO_BACKGROUND: false,
      MOBILE_APP_PROMO: false,
    },
    userInfo: {
      displayName: userDisplayName,
    },
  };
}
