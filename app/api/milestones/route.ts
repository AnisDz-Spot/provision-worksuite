import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "ProjectId is required" },
        { status: 400 }
      );
    }

    // Resolve project ID (UID, slug, or ID)
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { uid: String(projectId) },
          { slug: String(projectId) },
          { id: parseInt(projectId) || -1 },
        ],
      },
      select: { id: true, uid: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId: project.id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, data: milestones });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch milestones");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, projectId, title, start, target, description, order } = body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "ProjectId and title are required" },
        { status: 400 }
      );
    }

    // Resolve project ID
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { uid: String(projectId) },
          { slug: String(projectId) },
          {
            id:
              typeof projectId === "number"
                ? projectId
                : parseInt(projectId) || -1,
          },
        ],
      },
      select: { id: true, uid: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch DB user for Integer ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    const isNew = !id || id.startsWith("m_");

    const milestone = await prisma.milestone.upsert({
      where: { id: isNew ? "non-existent" : id },
      update: {
        name: title,
        description: description || null,
        startDate: start ? new Date(start) : null,
        dueDate: target ? new Date(target) : null,
        order: order || 0,
      },
      create: {
        id: isNew ? undefined : id,
        projectId: project.id,
        name: title,
        description: description || null,
        startDate: start ? new Date(start) : null,
        dueDate: target ? new Date(target) : null,
        status: "pending",
        order: order || 0,
      },
    });

    // Record Activity
    if (dbUser) {
      try {
        const { recordActivity } = await import("@/lib/activity");
        await recordActivity(
          dbUser.id,
          "milestone",
          milestone.id,
          isNew ? "created" : "updated",
          {
            title: milestone.name,
            projectId: project.uid,
          }
        );
      } catch (activityError) {
        console.error("Failed to record activity:", activityError);
      }
    }

    return NextResponse.json({ success: true, data: milestone });
  } catch (error) {
    console.error("API Error in POST /api/milestones:", error);
    log.error({ err: error }, "Failed to save milestone");
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
