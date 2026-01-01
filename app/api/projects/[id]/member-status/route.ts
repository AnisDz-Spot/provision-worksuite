import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin, isProjectManager } from "@/lib/auth";

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

    // Resolve project
    let project = await prisma.project.findFirst({ where: { slug: id } });
    if (!project)
      project = await prisma.project.findFirst({ where: { uid: id } });
    if (!project) {
      const idAsInt = parseInt(id);
      if (!isNaN(idAsInt))
        project = await prisma.project.findUnique({ where: { id: idAsInt } });
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization: only admins, master admins, or project managers can view
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isProjectOwner = project.userId === dbUser.id;
    const canView = isAdmin(user) || isProjectManager(user) || isProjectOwner;

    if (!canView) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Fetch members with acceptance status
    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        inviter: {
          select: { name: true },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const formattedMembers = members.map((m) => ({
      userId: m.user.id,
      userName: m.user.name,
      userEmail: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      invitationAcceptedAt: m.invitationAcceptedAt?.toISOString() || null,
      invitedBy: m.invitedBy,
      inviterName: m.inviter?.name || null,
    }));

    return NextResponse.json({ success: true, members: formattedMembers });
  } catch (error) {
    console.error("Fetch member status error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
