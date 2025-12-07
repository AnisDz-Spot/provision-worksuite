import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: {
          select: {
            uid: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    log.info({ count: tasks.length }, "Fetched all tasks");

    return NextResponse.json({
      success: true,
      data: tasks,
      source: "database",
    });
  } catch (error) {
    log.error({ err: error }, "Get tasks error");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks from database",
        data: [],
        source: "database",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      title,
      description,
      status,
      priority,
      assignee,
      due,
      estimateHours,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { success: false, error: "ProjectId and title are required." },
        { status: 400 }
      );
    }

    // Generate unique uid
    const uid = `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const task = await prisma.task.create({
      data: {
        uid,
        projectId,
        title,
        description: description || null,
        status: status || "todo",
        priority: priority || "medium",
        assignee: assignee || null,
        due: due ? new Date(due) : null,
        estimateHours: estimateHours ? parseFloat(estimateHours) : null,
      },
      include: {
        project: true,
      },
    });

    log.info({ taskId: task.id, taskUid: uid, projectId }, "Task created");

    return NextResponse.json({ success: true, task });
  } catch (error) {
    log.error({ err: error }, "Create task error");
    return NextResponse.json(
      { success: false, error: "Failed to create task." },
      { status: 500 }
    );
  }
}
