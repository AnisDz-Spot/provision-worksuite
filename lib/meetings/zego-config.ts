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
  userName: string
): ZegoConfig {
  if (!ZEGO_APP_ID || !ZEGO_SERVER_SECRET) {
    console.warn(
      "ZegoCloud credentials are not configured in environment variables."
    );
  }

  return {
    appID: ZEGO_APP_ID || 0,
    serverSecret: ZEGO_SERVER_SECRET || "",
    roomID,
    userID,
    userName,
  };
}
