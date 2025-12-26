import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { revalidateTag } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        OR: [{ uid: id }, { id: parseInt(id) || -1 }],
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch task");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const task = await prisma.task.findFirst({
      where: {
        OR: [{ uid: id }, { id: parseInt(id) || -1 }],
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        due: body.due ? new Date(body.due) : undefined,
        estimateHours:
          body.estimateHours !== undefined
            ? parseFloat(body.estimateHours)
            : undefined,
        loggedHours:
          body.loggedHours !== undefined
            ? parseFloat(body.loggedHours)
            : undefined,
        labels: body.labels,
        boardColumn: body.boardColumn,
        order: body.order,
        assigneeId: body.assigneeId,
      },
    });

    (revalidateTag as any)("tasks");
    (revalidateTag as any)("projects");

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    log.error({ err: error }, "Failed to update task");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
