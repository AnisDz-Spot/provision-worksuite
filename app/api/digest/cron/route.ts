import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDigestData } from "@/lib/reports/digest-logic";
import { generateHTMLDigest } from "@/lib/reports/digest-utils";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/digest/cron?secret=XXX
 * This endpoint should be called periodically (e.g. every hour)
 * by a cron service or script.
 */
export async function GET(req: Request) {
  // 1. Security Check
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const CRON_SECRET =
    process.env.CRON_SECRET || "provision-default-cron-secret";

  if (secret !== CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
    const currentHour = now.getHours();

    // 2. Fetch all enabled digest settings
    // We include the user to know whose data to gather
    const enabledSettings = await prisma.digestSettings.findMany({
      where: {
        enabled: true,
        recipients: { isEmpty: false },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            uid: true,
          },
        },
      },
    });

    const results: any[] = [];

    for (const setting of enabledSettings) {
      // 3. Check if it's the right day
      if (setting.dayOfWeek !== currentDay) continue;

      // 4. Check if it's the right time
      // settings.time is string e.g. "09:00"
      const [targetHour] = setting.time.split(":").map(Number);

      // We check if current hour matches target hour.
      // This allows the cron to run anytime during that hour.
      if (currentHour !== targetHour) continue;

      // 5. Check if already sent today
      if (setting.lastSentAt) {
        const lastSent = new Date(setting.lastSentAt);
        if (
          lastSent.getDate() === now.getDate() &&
          lastSent.getMonth() === now.getMonth() &&
          lastSent.getFullYear() === now.getFullYear()
        ) {
          // Already sent in this 24-hour period
          continue;
        }
      }

      // 6. Gather data and send
      console.log(
        `[Digest Cron] Triggering digest for user: ${setting.user.email}`,
      );
      try {
        // Gather data based on users uid (which is what tasks/projects project_id/user_id use)
        // Now getDigestData supports userId (setting.userId is the Int ID)
        const digestData = await getDigestData(setting.userId);
        const htmlContent = generateHTMLDigest(digestData);

        const subject = `Weekly Project Digest - ${digestData.weekRange}`;

        const sendPromises = setting.recipients.map((recipient: any) =>
          sendEmail({
            to: recipient,
            subject,
            text: `Weekly Project Digest for ${digestData.weekRange}\n\nView the full digest in HTML email.`,
            html: htmlContent,
          }),
        );

        const sendResults = await Promise.all(sendPromises);
        const success = sendResults.every((r) => r.success);

        // 7. Update lastSentAt even if failed partly, to avoid infinite retries in same hour
        await prisma.digestSettings.update({
          where: { id: setting.id },
          data: { lastSentAt: now },
        });

        results.push({
          user: setting.user.email,
          success,
          recipients: setting.recipients.length,
          previewUrls: sendResults.map((r) => r.previewUrl).filter(Boolean),
        });
      } catch (err: any) {
        console.error(
          `[Digest Cron] Error processing user ${setting.user.email}:`,
          err,
        );
        results.push({
          user: setting.user.email,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: enabledSettings.length,
      sent: results.length,
      details: results,
    });
  } catch (error: any) {
    console.error("[Digest Cron] Global error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
