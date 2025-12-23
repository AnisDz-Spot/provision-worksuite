/**
 * ZegoCloud Configuration
 * Environment-based configuration for ZegoCloud integration
 */

export const ZEGO_APP_ID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
export const ZEGO_SERVER_SECRET = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET;

export interface ZegoConfig {
  appID: number;
  serverSecret: string;
  roomID: string;
  userID: string;
  userName: string;
}

/**
 * Get ZegoCloud configuration for a meeting
 * @param roomID - The unique room ID
 * @param userID - Unique user ID
 * @param userName - User's display name
 * @returns Zego configuration object
 */
export function getZegoConfig(
  roomID: string,
  userID: string,
  userName: string,
  overrides?: { appID?: number | null; serverSecret?: string | null }
): ZegoConfig {
  const appID = overrides?.appID || ZEGO_APP_ID;
  const serverSecret = overrides?.serverSecret || ZEGO_SERVER_SECRET;

  if (!appID || !serverSecret) {
    console.warn("ZegoCloud credentials are not configured correctly.");
  }

  return {
    appID: appID || 0,
    serverSecret: serverSecret || "",
    roomID,
    userID,
    userName,
  };
}
