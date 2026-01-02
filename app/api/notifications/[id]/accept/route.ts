import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify this notification belongs to the current user
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser || notification.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already responded
    if (notification.acceptedAt || notification.rejectedAt) {
      return NextResponse.json(
        { error: "Already responded to this notification" },
        { status: 400 }
      );
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        acceptedAt: new Date(),
        isRead: true,
      },
    });

    // If this is a project_invitation, update ProjectMember
    if (notification.type === "project_invitation" && notification.link) {
      // Extract project UID/slug from link (/projects/{id})
      const projectId = notification.link.split("/").pop();

      if (projectId) {
        // Find project and its owner
        let project = await prisma.project.findFirst({
          where: { slug: projectId },
          include: { user: true },
        });
        if (!project) {
          project = await prisma.project.findFirst({
            where: { uid: projectId },
            include: { user: true },
          });
        }

        if (project) {
          // Update ProjectMember acceptance timestamp
          await prisma.projectMember.updateMany({
            where: {
              projectId: project.id,
              userId: dbUser.id,
            },
            data: {
              invitationAcceptedAt: new Date(),
            },
          });

          // Fetch Master Admins / Global Admin
          const admins = await prisma.user.findMany({
            where: {
              OR: [
                { role: "GLOBAL_ADMIN" },
                { role: "admin" },
                { role: "master admin" },
              ],
            },
            select: { id: true },
          });

          // Notify Project Owner
          const recipients = new Set<number>();
          if (project.userId) recipients.add(project.userId);
          admins.forEach((admin: any) => recipients.add(admin.id));

          // Create Notifications
          const notificationsData = Array.from(recipients).map((userId) => ({
            userId,
            type: "invitation_accepted",
            title: "Invitation Accepted",
            message: `${dbUser.name || dbUser.email} has accepted the invitation to join ${project.name}`,
            link: `/projects/${project.uid}`,
            isRead: false,
            createdAt: new Date(),
          }));

          if (notificationsData.length > 0) {
            await prisma.notification.createMany({
              data: notificationsData,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Accept notification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
