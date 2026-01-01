import { NextRequest, NextResponse } from \"next/server\";
import prisma from \"@/lib/prisma\";
import { getAuthenticatedUser } from \"@/lib/auth\";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Fetch notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: \"Notification not found\" },
        { status: 404 }
      );
    }

    // Verify this notification belongs to the current user
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser || notification.userId !== dbUser.id) {
      return NextResponse.json({ error: \"Forbidden\" }, { status: 403 });
    }

    // Check if already responded
    if (notification.acceptedAt || notification.rejectedAt) {
      return NextResponse.json(
        { error: \"Already responded to this notification\" },
        { status: 400 }
      );
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: {
        rejectedAt: new Date(),
        responseNote: body.note || null,
        isRead: true,
      },
    });

    // If this is a project_invitation, optionally remove from ProjectMember
    if (notification.type === \"project_invitation\" && notification.link) {
      // Extract project UID/slug from link
      const projectId = notification.link.split(\"/\").pop();
      
      if (projectId) {
        // Find project
        let project = await prisma.project.findFirst({
          where: { slug: projectId },
        });
        if (!project) {
          project = await prisma.project.findFirst({
            where: { uid: projectId },
          });
        }

        if (project) {
          // Remove from project members (optional behavior)
          await prisma.projectMember.deleteMany({
            where: {
              projectId: project.id,
              userId: dbUser.id,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error(\"Reject notification error:\", error);
    return NextResponse.json(
      { error: \"Internal Server Error\" },
      { status: 500 }
    );
  }
}
