import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  // SECURITY: Require authentication to view projects
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Filter projects by user unless admin
    const whereClause =
      currentUser.role === "admin" || currentUser.role === "global-admin"
        ? {} // Admins see all projects
        : { userId: currentUser.uid }; // Regular users see only their projects

    const projects = await prisma.project.findMany({
      where: whereClause,
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

    log.info(
      { count: projects.length, userId: currentUser.uid },
      "Fetched projects"
    );

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
  // SECURITY: Require authentication to create projects
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // AUTHORIZATION: Only admins and project-managers can create projects
  const allowedRoles = ["admin", "global-admin", "project-manager"];
  if (!allowedRoles.includes(currentUser.role)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Forbidden: Only administrators and project managers can create projects",
      },
      { status: 403 }
    );
  }

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

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Project name is required." },
        { status: 400 }
      );
    }

    // SECURITY: Use authenticated user's ID, not from request body
    const projectUserId = userId || currentUser.uid;

    // SECURITY: Only allow creating projects for self unless admin
    if (
      projectUserId !== currentUser.uid &&
      currentUser.role !== "admin" &&
      currentUser.role !== "global-admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Cannot create projects for other users",
        },
        { status: 403 }
      );
    }

    // SECURITY: Generate cryptographically secure UID
    const uid = `project_${randomUUID()}`;

    const project = await prisma.project.create({
      data: {
        uid,
        name,
        description: description || null,
        status: status || "active",
        owner: owner || name,
        userId: projectUserId,
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
      {
        projectId: project.id,
        projectUid: uid,
        userId: currentUser.uid,
        role: currentUser.role,
      },
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
