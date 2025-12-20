/**
 * Recurring Task Generation Cron Job
 *
 * This endpoint is called by Vercel Cron to generate tasks from recurring templates.
 * Schedule: Daily at midnight UTC
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getNextOccurrence } from "@/lib/recurring";

export const dynamic = "force-dynamic";

// Vercel Cron config - runs daily at midnight UTC
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow if no secret configured (dev mode) or if secret matches
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find all active templates where nextRun <= now
    const templates = await prisma.recurringTaskTemplate.findMany({
      where: {
        isActive: true,
        nextRun: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    log.info({ count: templates.length }, "Processing recurring templates");

    const createdTasks: string[] = [];

    for (const template of templates) {
      // Check occurrence limit
      if (
        template.occurrences &&
        template.occurrenceCount >= template.occurrences
      ) {
        // Deactivate template - max occurrences reached
        await prisma.recurringTaskTemplate.update({
          where: { id: template.id },
          data: { isActive: false },
        });
        continue;
      }

      // Create task from template
      const task = await prisma.task.create({
        data: {
          projectId: template.projectId,
          title: template.title,
          description: template.description,
          priority: template.priority,
          labels: template.labels,
          estimateHours: template.estimateHours,
          assigneeId: template.assigneeId,
          status: "todo",
          boardColumn: "todo",
          isRecurring: true,
          templateId: template.id,
        },
      });

      createdTasks.push(task.uid);

      // Calculate next run
      const nextRun = getNextOccurrence(template.recurrenceRule, now);

      // Update template
      await prisma.recurringTaskTemplate.update({
        where: { id: template.id },
        data: {
          lastRun: now,
          nextRun,
          occurrenceCount: { increment: 1 },
        },
      });
    }

    log.info({ created: createdTasks.length }, "Recurring tasks generated");

    return NextResponse.json({
      success: true,
      processed: templates.length,
      created: createdTasks.length,
      taskIds: createdTasks,
    });
  } catch (error) {
    log.error({ err: error }, "Recurring task generation failed");
    return NextResponse.json(
      { error: "Failed to generate recurring tasks" },
      { status: 500 }
    );
  }
}
