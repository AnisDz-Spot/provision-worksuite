import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET() {
  // In demo mode, return empty tasks
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({ success: true, data: [], source: "demo" });
  }

  // SECURITY: Require authentication to view tasks
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const currentUserId = parseInt(currentUser.uid) || 0;

    // Build where clause based on role
    const whereClause =
      currentUser.role === "admin" || currentUser.role === "global-admin"
        ? {} // Admins see all tasks
        : {
            // Regular users see tasks from their projects or assigned to them
            OR: [
              { project: { userId: currentUserId } },
              { project: { members: { some: { userId: currentUserId } } } },
              { assigneeId: currentUserId },
              { watchers: { has: currentUser.uid } },
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
        assignee: {
          select: {
            uid: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { boardColumn: "asc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
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
      assigneeId,
      due,
      estimateHours,
      labels,
      boardColumn,
      order,
      parentTaskId,
      watchers,
    } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { success: false, error: "ProjectId and title are required." },
        { status: 400 }
      );
    }

    const currentUserId = parseInt(currentUser.uid) || 0;

    // SECURITY: Verify user owns the project, is a member, or is admin
    const project = await prisma.project.findUnique({
      where: { uid: projectId },
      select: {
        userId: true,
        members: {
          where: { userId: currentUserId },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === currentUserId;
    const isMember = project.members.length > 0;
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "global-admin";

    if (!isOwner && !isMember && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Forbidden: Cannot create tasks for projects you don't have access to",
        },
        { status: 403 }
      );
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        status: status || "todo",
        priority: priority || "medium",
        assigneeId: assigneeId || null,
        due: due ? new Date(due) : null,
        estimateHours: estimateHours ? parseFloat(estimateHours) : null,
        labels: labels || [],
        boardColumn: boardColumn || status || "todo",
        order: order || 0,
        parentTaskId: parentTaskId || null,
        watchers: watchers || [],
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    log.info(
      {
        taskId: task.id,
        taskUid: task.uid,
        projectId,
        userId: currentUser.uid,
      },
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
