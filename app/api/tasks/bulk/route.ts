import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { tasks } = await request.json();

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { success: false, error: "Invalid tasks array" },
        { status: 400 }
      );
    }

    if (tasks.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Limit batch size to prevent timeout
    if (tasks.length > 100) {
      return NextResponse.json(
        { success: false, error: "Maximum 100 tasks per batch" },
        { status: 400 }
      );
    }

    //Validate all tasks have required projectId
    const invalidTasks = tasks.filter((t: any) => !t.projectId);
    if (invalidTasks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `${invalidTasks.length} tasks missing required projectId`,
        },
        { status: 400 }
      );
    }

    // Pre-resolve all project UIDs to handle numeric IDs from frontend
    const projectIds = [...new Set(tasks.map((t: any) => t.projectId))];
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { uid: { in: projectIds } },
          {
            id: {
              in: projectIds
                .map((id) => parseInt(id))
                .filter((id) => !isNaN(id)),
            },
          },
        ],
      },
      select: { id: true, uid: true },
    });

    const projectIdToUidMap = new Map();
    projects.forEach((p: { id: number; uid: string }) => {
      projectIdToUidMap.set(p.uid, p.uid);
      projectIdToUidMap.set(p.id.toString(), p.uid);
    });

    // Process each task sequentially to avoid transaction complexity
    let successCount = 0;
    const errors: string[] = [];

    for (const task of tasks) {
      try {
        const resolvedProjectId = projectIdToUidMap.get(task.projectId);
        if (!resolvedProjectId) {
          errors.push(`Task ${task.id || task.title}: Project not found`);
          continue;
        }

        await prisma.task.upsert({
          where: { uid: task.id || task.uid || "" },
          create: {
            uid: task.id || task.uid,
            projectId: resolvedProjectId,
            title: task.title || "Untitled Task",
            description: task.description || null,
            status: task.status || "todo",
            priority: task.priority || "medium",
            due:
              task.dueDate || task.due
                ? new Date(task.dueDate || task.due)
                : null,
            boardColumn: task.status || "todo",
            estimateHours: task.estimateHours || null,
            labels: task.tags || [],
          },
          update: {
            projectId: resolvedProjectId,
            title: task.title || "Untitled Task",
            description: task.description || null,
            status: task.status || "todo",
            priority: task.priority || "medium",
            due:
              task.dueDate || task.due
                ? new Date(task.dueDate || task.due)
                : null,
            boardColumn: task.status || "todo",
            estimateHours: task.estimateHours || null,
            labels: task.tags || [],
          },
        });
        successCount++;
      } catch (err) {
        errors.push(`Task ${task.id || task.title}: ${err}`);
      }
    }

    log.info(
      { count: successCount, errors: errors.length, userId: user.uid },
      "Bulk saved tasks"
    );

    return NextResponse.json({
      success: errors.length === 0,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log.error({ err: error }, "Bulk save tasks failed");
    return NextResponse.json(
      { success: false, error: "Failed to save tasks" },
      { status: 500 }
    );
  }
}
