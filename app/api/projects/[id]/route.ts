import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 }
      );
    }

    // Try finding by Slug first (most specific for friendly URLs)
    let project = await prisma.project.findFirst({
      where: { slug: id },
      include: {
        members: {
          include: {
            user: {
              select: {
                uid: true,
                name: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
        files: true,
        tasks: {
          select: {
            status: true,
            estimateHours: true,
            loggedHours: true,
          },
        },
      },
    });

    // Try finding by UID if not found
    if (!project) {
      project = await prisma.project.findFirst({
        where: { uid: id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  uid: true,
                  name: true,
                  avatarUrl: true,
                  email: true,
                },
              },
            },
          },
          files: true,
          tasks: {
            select: {
              status: true,
              estimateHours: true,
              loggedHours: true,
            },
          },
        },
      });
    }

    // Try finding by ID (Int) - for legacy URLs support
    if (!project) {
      const idAsInt = parseInt(id);
      if (!isNaN(idAsInt)) {
        project = await prisma.project.findUnique({
          where: { id: idAsInt },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    uid: true,
                    name: true,
                    avatarUrl: true,
                    email: true,
                  },
                },
              },
            },
            files: true,
            tasks: {
              select: {
                status: true,
                estimateHours: true,
                loggedHours: true,
              },
            },
          },
        });
      }
    }

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Auto-backfill slug if missing
    if (!project.slug) {
      const slug = project.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Simple uniqueness check
      let uniqueSlug = slug;
      const existing = await prisma.project.findUnique({
        where: { slug: uniqueSlug },
      });
      if (existing) {
        uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      await prisma.project.update({
        where: { id: project.id },
        data: { slug: uniqueSlug },
      });
      project.slug = uniqueSlug;
    }

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Resolve project (Slug -> UID -> ID)
    let project = await prisma.project.findFirst({ where: { slug: id } });
    if (!project)
      project = await prisma.project.findFirst({ where: { uid: id } });
    if (!project) {
      const idAsInt = parseInt(id);
      if (!isNaN(idAsInt)) {
        project = await prisma.project.findUnique({ where: { id: idAsInt } });
      }
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        budget: body.budget ? parseFloat(body.budget) : undefined,
        clientName: body.clientName,
        clientId: body.clientId,
        tags: body.tags,
        categories: body.categories,
        visibility: body.visibility || body.privacy, // Handle privacy mapped to visibility
        coverUrl: body.cover,
        sla: body.sla,
        isTemplate: body.isTemplate,
        attachments: body.attachments,
        // clientLogo is removed as per requirement, but if passed and needed for fallback:
        // clientLogo: body.clientLogo
      },
    });

    // Handle members update if provided
    if (Array.isArray(body.members)) {
      // 1. Get current members to preserve "owner" if needed or just replace members
      // The user usually wants to manage the list.
      // We'll keep the owner (the project.userId) and replace the others.
      const ownerId = project.userId;

      // Get existing members to identify NEW members for notifications
      const existingMembers = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        select: { userId: true },
      });
      const existingMemberIds = new Set(
        existingMembers.map((m: { userId: number }) => m.userId)
      );

      // Delete existing non-owner members
      await prisma.projectMember.deleteMany({
        where: {
          projectId: project.id,
          userId: { not: ownerId },
        },
      });

      // Find user IDs for the incoming UIDs
      const memberUsers = await prisma.user.findMany({
        where: { uid: { in: body.members } },
        select: { id: true, email: true, name: true },
      });

      const memberIds = memberUsers
        .map((u: { id: number }) => u.id)
        .filter((id: number) => id !== ownerId);

      if (memberIds.length > 0) {
        await prisma.projectMember.createMany({
          data: memberIds.map((uid: number) => ({
            projectId: project.id,
            userId: uid,
            role: "member",
          })),
          skipDuplicates: true,
        });

        // Notify NEW members
        const addedUsers = memberUsers.filter(
          (u: { id: number }) =>
            !existingMemberIds.has(u.id) && u.id !== ownerId
        );

        if (addedUsers.length > 0) {
          // Import email sender dynamically to avoid circular deps if any
          const { sendProjectInvitationEmail } = await import("@/lib/email");

          // Get project URL (using slug if available, else uid)
          const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/projects/${project.slug || project.uid}`;

          await Promise.all(
            addedUsers.map(async (user: { email: string; id: number }) => {
              // 1. Send Email
              await sendProjectInvitationEmail(
                user.email,
                project.name,
                projectUrl
              );

              // 2. Create In-App Notification
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  type: "project_invitation",
                  title: "New Project Assignment",
                  message: `You have been added to the project "${project.name}"`,
                  link: `/projects/${project.slug || project.uid}`,
                  isRead: false,
                },
              });
            })
          );
        }
      }
    }

    (revalidateTag as any)("projects");

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
