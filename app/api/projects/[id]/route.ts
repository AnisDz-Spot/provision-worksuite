import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_PROJECTS } from "@/lib/mock-data";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { recordActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In demo mode or for global admin, return mock project
    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      const { id } = await params;
      const project =
        MOCK_PROJECTS.find((p) => p.uid === id || p.slug === id) ||
        MOCK_PROJECTS[0];
      return NextResponse.json({ success: true, project, source: "mock" });
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
          include: {
            assignee: {
              select: {
                uid: true,
                name: true,
                avatarUrl: true,
              },
            },
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

    // Ensure the project creator (owner) is in the members list
    const creatorId = project.userId;
    const isCreatorInMembers = project.members.some(
      (m: any) => m.userId === creatorId
    );

    if (creatorId && !isCreatorInMembers) {
      const creatorUser = await prisma.user.findUnique({
        where: { id: creatorId },
        select: {
          uid: true,
          name: true,
          avatarUrl: true,
          email: true,
        },
      });

      if (creatorUser) {
        // Add a virtual member entry for the creator
        (project as any).members.push({
          userId: creatorId,
          role: "owner",
          user: creatorUser,
        });
      }
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

    // Fetch user from DB to get ID for activity logging
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

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

      // Delete existing members
      // If Master Admin, can delete anyone (including owner)
      // If not, must preserve owner
      const currentUser = await getAuthenticatedUser();
      const isMasterAdmin = [
        "admin",
        "global-admin",
        "master-admin",
        "Administrator",
        "Master Admin",
      ].includes(currentUser?.role || "");

      const deleteWhere: any = {
        projectId: project.id,
      };

      if (!isMasterAdmin) {
        deleteWhere.userId = { not: ownerId };
      }

      await prisma.projectMember.deleteMany({
        where: deleteWhere,
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
            invitedBy: dbUser?.id,
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
                  requiresAcceptance: true,
                },
              });
            })
          );
        }
      }
    }

    (revalidateTag as any)("projects");

    // Record Activity
    if (dbUser) {
      const activityData: any = { name: updated.name };
      let action = "updated";
      const changedFields: string[] = [];

      if (project.status !== updated.status) {
        action = "status_changed";
        activityData.status = updated.status;
        activityData.oldStatus = project.status;
        changedFields.push(
          `status from ${project.status} to ${updated.status}`
        );
      }
      if (project.priority !== updated.priority) {
        activityData.priority = updated.priority;
        activityData.oldPriority = project.priority;
        changedFields.push(
          `priority from ${project.priority} to ${updated.priority}`
        );
      }
      if (project.name !== updated.name) {
        changedFields.push(`name to ${updated.name}`);
      }
      if (
        body.deadline &&
        new Date(project.deadline || 0).getTime() !==
          new Date(body.deadline).getTime()
      ) {
        changedFields.push(
          `deadline to ${new Date(body.deadline).toLocaleDateString()}`
        );
      }

      if (changedFields.length > 0) {
        activityData.summary = `Updated ${changedFields.join(", ")}`;
      }

      await recordActivity(
        dbUser.id,
        "project",
        project.uid,
        action as any,
        activityData
      );
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // SECURITY: Only owner or admin can delete
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true, role: true },
    });

    const isAdmin = ["admin", "global-admin", "master-admin"].includes(
      dbUser?.role || ""
    );
    if (!isAdmin && project.userId !== dbUser?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const projectName = project.name;
    const projectUid = project.uid;

    await prisma.project.delete({
      where: { id: project.id },
    });

    (revalidateTag as any)("projects");

    // Record Activity
    if (dbUser) {
      await recordActivity(dbUser.id, "project", projectUid, "deleted", {
        name: projectName,
      });
    }

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
