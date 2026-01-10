import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { canLogTimeForTask } from "@/lib/authorization";
import { createTimeLogSchema, validateRequest } from "@/lib/schemas/validation";
import { revalidateTag } from "next/cache";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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
  // SECURITY: Require authentication
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Fetch user from DB to get Int ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: currentUser.uid },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found", data: [] },
        { status: 404 }
      );
    }

    // Filter time logs by user unless admin
    const isAdmin = [
      "admin",
      "global-admin",
      "master-admin",
      "Administrator",
      "Master Admin",
    ].includes(currentUser.role);

    const whereClause: any = {};

    // Non-admins see only their own time logs
    if (!isAdmin) {
      whereClause.loggedBy = currentUser.uid;
    }

    const timeLogs = await prisma.timeLog.findMany({
      where: whereClause,
      include: {
        task: {
          select: {
            uid: true,
            title: true,
          },
        },
      },
      orderBy: { loggedAt: "desc" },
      take: 100, // Limit results for performance
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
      task: tl.task,
    }));

    log.info(
      { count: timeLogs.length, userId: currentUser.uid },
      "Fetched time logs"
    );

    return NextResponse.json({ success: true, data: mappedLogs });
  } catch (error) {
    log.error({ err: error }, "Get time logs error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch time logs", data: [] },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(RATE_LIMITS.TIME_LOG, async (req: any) => {
  // SECURITY: Require authentication
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // SECURITY: Validate input with Zod
    const validation = validateRequest(createTimeLogSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error?.message || "Validation failed",
          details: validation.error?.details.flatten(),
        },
        { status: 400 }
      );
    }

    const { taskId, hours, description, date } = validation.data;

    // Fetch user from DB to get Int ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: currentUser.uid },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // SECURITY: Check if user can log time for this task
    const authCheck = await canLogTimeForTask(
      dbUser.id,
      taskId,
      currentUser.role
    );

    if (!authCheck.authorized) {
      log.warn(
        {
          userId: currentUser.uid,
          taskId,
          reason: authCheck.reason,
        },
        "Unauthorized time log attempt"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            authCheck.reason ||
            "You are not authorized to log time for this task",
        },
        { status: 403 }
      );
    }

    // Get project ID from task
    const task = await prisma.task.findUnique({
      where: { uid: taskId },
      select: { projectUid: true, title: true },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Create time log in a transaction to ensure consistency
    const timeLog = await prisma.$transaction(async (tx: any) => {
      // Create the time log
      const newLog = await tx.timeLog.create({
        data: {
          taskId,
          projectId: task.projectUid,
          hours,
          note: description || null,
          loggedBy: currentUser.uid,
          loggedAt: date ? new Date(date) : new Date(),
        },
        include: {
          task: {
            select: {
              uid: true,
              title: true,
            },
          },
        },
      });

      // Update task logged hours
      await tx.task.update({
        where: { uid: taskId },
        data: {
          loggedHours: {
            increment: hours,
          },
        },
      });

      return newLog;
    });

    log.info(
      {
        taskId,
        projectId: task.projectUid,
        hours,
        userId: currentUser.uid,
      },
      "Time log created"
    );

    // Revalidate cache
    (revalidateTag as any)("time-logs");
    (revalidateTag as any)(`task-${taskId}`);

    return NextResponse.json({
      success: true,
      data: {
        id: timeLog.id,
        task_id: timeLog.taskId,
        project_id: timeLog.projectId,
        hours: timeLog.hours,
        note: timeLog.note,
        logged_by: timeLog.loggedBy,
        logged_at: timeLog.loggedAt,
        task: timeLog.task,
      },
    });
  } catch (error: any) {
    log.error({ err: error, stack: error.stack }, "Create time log error");
    return NextResponse.json(
      { success: false, error: "Failed to create time log" },
      { status: 500 }
    );
  }
});
