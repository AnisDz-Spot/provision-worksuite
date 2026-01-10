import prisma from "@/lib/prisma"; // Use default import
import { headers } from "next/headers";
import { UAParser } from "ua-parser-js";

export async function createSession(userId: number, token: string) {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "Unknown";

    // Basic GeoIP from standard CDN headers (Vercel, Cloudflare)
    const city = headersList.get("x-vercel-ip-city");
    const country = headersList.get("x-vercel-ip-country");
    const location =
      city && country ? `${city}, ${country}` : "Unknown Location";

    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const deviceInfo =
      `${result.os.name || "Unknown OS"} ${result.os.version || ""} - ${result.browser.name || "Unknown Browser"}`.trim();

    // Expire in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return await prisma.session.create({
      data: {
        userId,
        token,
        deviceInfo,
        ipAddress: ip,
        location: location !== "Unknown Location" ? location : undefined,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    // Don't block login if session tracking fails
    return null;
  }
}

export async function getActiveSessions(userId: number) {
  return prisma.session.findMany({
    where: {
      userId,
      isValid: true,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastActiveAt: "desc" },
  });
}

/**
 * Updates the lastActiveAt timestamp for a session.
 * Throttled: Only updates if > 5 minutes have passed since last update.
 */
export async function updateSessionActivity(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { lastActiveAt: true },
    });

    if (!session) return;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (session.lastActiveAt < fiveMinutesAgo) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastActiveAt: new Date() },
      });
    }
  } catch (error) {
    // Fail silently to avoid interrupting requests
    console.error("Failed to update session activity:", error);
  }
}

export async function revokeSession(sessionId: string, userId: number) {
  return prisma.session.update({
    where: { id: sessionId, userId }, // Ensure user owns session
    data: { isValid: false },
  });
}

export async function revokeAllSessions(userId: number, currentToken?: string) {
  try {
    const where: any = { userId };

    // If currentToken provided, don't revoke it
    if (currentToken) {
      where.token = { not: currentToken };
    }

    return await prisma.session.updateMany({
      where,
      data: { isValid: false },
    });
  } catch (error) {
    console.error("Failed to revoke sessions:", error);
    throw error;
  }
}
