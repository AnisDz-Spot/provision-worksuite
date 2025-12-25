import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { revalidateTag } from "next/cache";
import { logProjectEvent } from "@/lib/utils";

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
    // Fetch user from DB to get Int ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: currentUser.uid },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      // User authenticated via JWT but not found in DB?
      // Should not happen in normal flow, but return empty
      return NextResponse.json({ success: true, data: [], source: "database" });
    }

    // Filter projects by user unless admin
    const isAdmin = [
      "admin",
      "global-admin",
      "master-admin",
      "Administrator",
      "Master Admin",
    ].includes(currentUser.role);

    const whereClause = isAdmin
      ? { archivedAt: null } // Admins see all non-archived projects
      : {
          OR: [
            { userId: dbUser.id },
            { members: { some: { userId: dbUser.id } } },
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
        tasks: {
          select: {
            status: true,
            estimateHours: true,
            loggedHours: true,
          },
        },
        stars: {
          where: { userId: dbUser.id },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map starred status
    const data = projects.map((p: any) => ({
      ...p,
      starred: p.stars.length > 0,
    }));

    log.info(
      { count: projects.length, userId: currentUser.uid },
      "Fetched projects"
    );

    return NextResponse.json({
      success: true,
      data: data,
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
  const allowedRoles = [
    "admin",
    "global-admin",
    "project-manager",
    "master-admin",
    "master_admin",
    "Master Admin",
    "Administrator",
  ];
  if (!allowedRoles.includes(currentUser.role)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Forbidden: Only administrators, master admins, and project managers can create projects",
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
      clientId,
      tags,
      visibility,
      color,
      cover,
      clientLogo,
      files,
      members,
      sla,
      attachments,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Project name is required." },
        { status: 400 }
      );
    }

    // Generate Slug
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Ensure uniqueness (simple append for now, or assume name is unique enough + uid handles collision by failing? No, we need unique slug)
    // For now, let's append a random short string to ensure uniqueness basically always
    // Or better, check if exists? Checking adds latency.
    // The user wants "use project name instead of uid".
    // I will use `slug` as is, but if it fails (unique constraint), valid names might clash.
    // Let's append 4 chars of random string to be safe and cleaner than UUID?
    // Or just use name and catch error?
    // User request: "slug: use project name instead of uid".
    // I'll try to use name-slug. If it exists, I'll append a suffix.
    // Actually, checking DB is safer.

    let uniqueSlug = slug;
    const existing = await prisma.project.findFirst({
      where: { slug: uniqueSlug },
    });
    if (existing) {
      uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Fetch user for Int ID
    const dbUser = await prisma.user.findUnique({
      where: { uid: currentUser.uid },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Use current user's ID for the project
    const projectUserId = dbUser.id;

    const project = await prisma.project.create({
      data: {
        name,
        slug: uniqueSlug,
        description: description || null,
        status: status || "active",
        userId: projectUserId,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget ? parseFloat(budget) : null,
        priority: priority || null,
        clientName: clientName || null,
        clientId: clientId || null,
        tags: body.tags || [],
        categories: body.categories || [],
        visibility: body.visibility || "private",
        color: color || null,
        coverUrl: cover || null,
        clientLogo: clientLogo || null,
        sla: sla || null,
        attachments: attachments || [],
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

    // Add other members
    if (Array.isArray(members) && members.length > 0) {
      // Find user IDs from UIDs
      const memberUsers = await prisma.user.findMany({
        where: { uid: { in: members } },
        select: { id: true },
      });

      const memberIds = memberUsers
        .map((u: { id: number }) => u.id)
        .filter((id: number) => id !== projectUserId);

      if (memberIds.length > 0) {
        await prisma.projectMember.createMany({
          data: memberIds.map((uid: number) => ({
            projectId: project.id,
            userId: uid,
            role: "member",
          })),
          skipDuplicates: true,
        });
      }
    }

    // Add Files
    if (Array.isArray(files) && files.length > 0) {
      await prisma.file.createMany({
        data: files.map((f: any) => ({
          projectId: project.id,
          filename: f.name,
          fileUrl: f.url,
          fileSize: f.size,
          mimeType: f.type,
          uploadedBy: projectUserId,
        })),
      });
    }

    log.info(
      {
        projectId: project.id,
        projectUid: project.uid,
        userId: currentUser.uid,
        role: currentUser.role,
      },
      "Project created"
    );

    // Clear projects cache
    (revalidateTag as any)("projects");

    return NextResponse.json({ success: true, project });
  } catch (error) {
    log.error({ err: error }, "Create project error");
    return NextResponse.json(
      { success: false, error: "Failed to create project." },
      { status: 500 }
    );
  }
}
