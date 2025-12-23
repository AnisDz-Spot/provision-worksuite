import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

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
          },
        });
      }
    }

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
        // clientLogo is removed as per requirement, but if passed and needed for fallback:
        // clientLogo: body.clientLogo
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
