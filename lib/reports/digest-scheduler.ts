import prisma from "@/lib/prisma";
import { getDigestData } from "./digest-logic";
import { generateHTMLDigest } from "./digest-utils";
import { sendEmail } from "@/lib/email";

// Prevents multiple intervals from being created during hot-reloading (HMR)
const globalForCron = globalThis as unknown as {
  digestInterval: NodeJS.Timeout | undefined;
};

/**
 * Starts the internal background scheduler
 * This should be called once on server startup
 */
export function startDigestScheduler() {
  if (globalForCron.digestInterval) {
    console.log("[Scheduler] Digest scheduler already running.");
    return;
  }

  console.log("[Scheduler] Initializing Weekly Digest background scheduler...");

  // Run every 10 minutes (600,000 ms) to check for due digests
  // This is lightweight enough for local dev and small VPS
  globalForCron.digestInterval = setInterval(
    async () => {
      try {
        await runCronLogic();
      } catch (error) {
        console.error("[Scheduler] Error in digest cron task:", error);
      }
    },
    10 * 60 * 1000
  );

  // Run once immediately on start (optional, but good for verification)
  runCronLogic().catch((e) =>
    console.error("[Scheduler] Initial run failed:", e)
  );
}

async function runCronLogic() {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  console.log(
    `[Scheduler] Checking for due digests at ${now.toISOString()}...`
  );

  // Fetch all enabled digest settings
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

  for (const setting of enabledSettings) {
    // 1. Day Check
    if (setting.dayOfWeek !== currentDay) continue;

    // 2. Hour Check
    const [targetHour] = setting.time.split(":").map(Number);
    if (currentHour !== targetHour) continue;

    // 3. Prevent Duplicates (Already sent today)
    if (setting.lastSentAt) {
      const lastSent = new Date(setting.lastSentAt);
      if (
        lastSent.getDate() === now.getDate() &&
        lastSent.getMonth() === now.getMonth() &&
        lastSent.getFullYear() === now.getFullYear()
      ) {
        continue;
      }
    }

    // 4. Gather & Send
    try {
      console.log(
        `[Scheduler] Sending scheduled digest to: ${setting.user.email}`
      );
      const digestData = await getDigestData();
      const htmlContent = generateHTMLDigest(digestData);
      const subject = `Weekly Project Digest - ${digestData.weekRange}`;

      const sendPromises = setting.recipients.map((recipient: any) =>
        sendEmail({
          to: recipient,
          subject,
          text: `Weekly Project Digest for ${digestData.weekRange}`,
          html: htmlContent,
        })
      );

      await Promise.all(sendPromises);

      // 5. Mark as sent
      await prisma.digestSettings.update({
        where: { id: setting.id },
        data: { lastSentAt: now },
      });

      console.log(
        `[Scheduler] Successfully sent digest for user ${setting.user.email}`
      );
    } catch (err) {
      console.error(
        `[Scheduler] Failed to send scheduled digest for ${setting.user.email}:`,
        err
      );
    }
  }
}
