/**
 * Recurring Tasks API
 * CRUD operations for recurring task templates
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getNextOccurrence } from "@/lib/recurring";

export const dynamic = "force-dynamic";

// GET - List recurring task templates
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (activeOnly) where.isActive = true;

    const templates = await prisma.recurringTaskTemplate.findMany({
      where,
      orderBy: { nextRun: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch recurring templates");
    return NextResponse.json(
      { error: "Failed to fetch recurring templates" },
      { status: 500 }
    );
  }
}

// POST - Create recurring task template
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      projectId,
      assigneeId,
      priority,
      labels,
      estimateHours,
      recurrenceRule,
      endDate,
      occurrences,
    } = body;

    if (!title || !projectId || !recurrenceRule) {
      return NextResponse.json(
        { error: "Missing required fields: title, projectId, recurrenceRule" },
        { status: 400 }
      );
    }

    // Get user's numeric ID
    const user = await prisma.user.findUnique({
      where: { uid: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate first run date
    const nextRun = getNextOccurrence(recurrenceRule, new Date());

    const template = await prisma.recurringTaskTemplate.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        priority: priority || "medium",
        labels: labels || [],
        estimateHours: estimateHours ? parseFloat(estimateHours) : null,
        recurrenceRule,
        nextRun,
        endDate: endDate ? new Date(endDate) : null,
        occurrences: occurrences ? parseInt(occurrences) : null,
        createdById: user.id,
      },
    });

    log.info({ templateId: template.id }, "Created recurring task template");

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    log.error({ err: error }, "Failed to create recurring template");
    return NextResponse.json(
      { error: "Failed to create recurring template" },
      { status: 500 }
    );
  }
}

// PUT - Update recurring task template
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    // Prepare update data
    const data: Record<string, unknown> = {};
    if (updates.title) data.title = updates.title;
    if (updates.description !== undefined)
      data.description = updates.description;
    if (updates.projectId) data.projectId = updates.projectId;
    if (updates.assigneeId !== undefined) {
      data.assigneeId = updates.assigneeId
        ? parseInt(updates.assigneeId)
        : null;
    }
    if (updates.priority) data.priority = updates.priority;
    if (updates.labels) data.labels = updates.labels;
    if (updates.estimateHours !== undefined) {
      data.estimateHours = updates.estimateHours
        ? parseFloat(updates.estimateHours)
        : null;
    }
    if (updates.recurrenceRule) {
      data.recurrenceRule = updates.recurrenceRule;
      // Recalculate next run if rule changes
      data.nextRun = getNextOccurrence(updates.recurrenceRule, new Date());
    }
    if (updates.endDate !== undefined) {
      data.endDate = updates.endDate ? new Date(updates.endDate) : null;
    }
    if (updates.occurrences !== undefined) {
      data.occurrences = updates.occurrences
        ? parseInt(updates.occurrences)
        : null;
    }
    if (updates.isActive !== undefined) data.isActive = updates.isActive;

    const template = await prisma.recurringTaskTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    log.error({ err: error }, "Failed to update recurring template");
    return NextResponse.json(
      { error: "Failed to update recurring template" },
      { status: 500 }
    );
  }
}

// DELETE - Remove recurring task template
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    await prisma.recurringTaskTemplate.delete({
      where: { id },
    });

    log.info({ templateId: id }, "Deleted recurring task template");

    return NextResponse.json({
      success: true,
      message: "Template deleted",
    });
  } catch (error) {
    log.error({ err: error }, "Failed to delete recurring template");
    return NextResponse.json(
      { error: "Failed to delete recurring template" },
      { status: 500 }
    );
  }
}
