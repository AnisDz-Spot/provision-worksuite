import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET() {
  // In demo mode, return empty projects
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({ success: true, data: [], source: "demo" });
  }

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
        ? { archivedAt: null } // Admins see all non-archived projects
        : {
            OR: [
              { userId: parseInt(currentUser.uid) || 0 },
              { members: { some: { userId: parseInt(currentUser.uid) || 0 } } },
            ],
            archivedAt: null,
          };

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                uid: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
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
      startDate,
      deadline,
      budget,
      priority,
      clientName,
      tags,
      visibility,
      color,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Project name is required." },
        { status: 400 }
      );
    }

    // Use current user's ID for the project
    const projectUserId = parseInt(currentUser.uid) || 0;

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: status || "active",
        userId: projectUserId,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget ? parseFloat(budget) : null,
        priority: priority || null,
        clientName: clientName || null,
        tags: tags || [],
        visibility: visibility || "private",
        color: color || null,
      },
      include: {
        user: true,
        members: true,
      },
    });

    // Also add the creator as an owner in project members
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: projectUserId,
        role: "owner",
      },
    });

    log.info(
      {
        projectId: project.id,
        projectUid: project.uid,
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
