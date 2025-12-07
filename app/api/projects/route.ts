import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    log.info({ count: projects.length }, "Fetched all projects");

    return NextResponse.json({
      success: true,
      data: projects,
      source: "database",
    });
  } catch (error) {
    log.error({ err: error }, "Get projects error");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects from database",
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
      name,
      description,
      status,
      owner,
      userId,
      startDate,
      deadline,
      budget,
      priority,
    } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: "Name and userId are required." },
        { status: 400 }
      );
    }

    // Generate unique uid for project
    const uid = `project_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const project = await prisma.project.create({
      data: {
        uid,
        name,
        description: description || null,
        status: status || "active",
        owner: owner || name,
        userId,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget ? parseFloat(budget) : null,
        priority: priority || null,
        progress: 0,
      },
      include: {
        user: true,
      },
    });

    log.info(
      { projectId: project.id, projectUid: uid, userId },
      "Project created"
    );

    return NextResponse.json({ success: true, project });
  } catch (error) {
    log.error({ err: error }, "Create project error");
    return NextResponse.json(
      { success: false, error: "Failed to create project." },
      { status: 500 }
    );
  }
}
