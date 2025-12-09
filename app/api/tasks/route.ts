import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  // SECURITY: Require authentication to view tasks
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Build where clause based on role
    const whereClause =
      currentUser.role === "admin" || currentUser.role === "global-admin"
        ? {} // Admins see all tasks
        : {
            // Regular users see tasks from their projects or assigned to them
            OR: [
              { project: { userId: currentUser.uid } },
              { assignee: currentUser.uid },
            ],
          };

    const tasks = await prisma.task.findMany({
      where: whereClause,
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

    log.info({ count: tasks.length, userId: currentUser.uid }, "Fetched tasks");

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
  // SECURITY: Require authentication to create tasks
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

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

    // SECURITY: Verify user owns the project or is admin
    const project = await prisma.project.findUnique({
      where: { uid: projectId },
      select: { userId: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    if (
      project.userId !== currentUser.uid &&
      currentUser.role !== "admin" &&
      currentUser.role !== "global-admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Cannot create tasks for projects you don't own",
        },
        { status: 403 }
      );
    }

    // SECURITY: Generate cryptographically secure UID
    const uid = `task_${randomUUID()}`;

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

    log.info(
      { taskId: task.id, taskUid: uid, projectId, userId: currentUser.uid },
      "Task created"
    );

    return NextResponse.json({ success: true, task });
  } catch (error) {
    log.error({ err: error }, "Create task error");
    return NextResponse.json(
      { success: false, error: "Failed to create task." },
      { status: 500 }
    );
  }
}
