import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface TimeLogResult {
  id: number;
  taskId: string;
  projectId: string;
  hours: number;
  note: string | null;
  loggedBy: string;
  loggedAt: Date;
  task?: { uid: string; title: string };
}

export async function GET() {
  try {
    const timeLogs = await prisma.timeLog.findMany({
      include: {
        task: {
          select: {
            uid: true,
            title: true,
          },
        },
      },
      orderBy: { loggedAt: "desc" },
    });

    // Map to match frontend expectations
    const mappedLogs = (timeLogs as TimeLogResult[]).map((tl) => ({
      id: tl.id,
      task_id: tl.taskId,
      project_id: tl.projectId,
      hours: tl.hours,
      note: tl.note,
      logged_by: tl.loggedBy,
      logged_at: tl.loggedAt,
    }));

    log.info({ count: timeLogs.length }, "Fetched time logs");

    return NextResponse.json({ success: true, data: mappedLogs });
  } catch (error) {
    log.error({ err: error }, "Get time logs error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch time logs", data: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, projectId, hours, note, loggedBy } = body;

    if (!taskId || !projectId || !hours) {
      return NextResponse.json(
        { success: false, error: "taskId, projectId, and hours are required" },
        { status: 400 }
      );
    }

    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        projectId,
        hours: parseFloat(hours),
        note: note || null,
        loggedBy: loggedBy || "unknown",
      },
      include: {
        task: true,
      },
    });

    // Update task logged hours
    await prisma.task.update({
      where: { uid: taskId }, // taskId is actually the uid (String), not the id (Int)
      data: {
        loggedHours: {
          increment: parseFloat(hours),
        },
      },
    });

    log.info({ taskId, projectId, hours }, "Time log created");

    return NextResponse.json({ success: true, data: timeLog });
  } catch (error) {
    log.error({ err: error }, "Create time log error");
    return NextResponse.json(
      { success: false, error: "Failed to create time log" },
      { status: 500 }
    );
  }
}
