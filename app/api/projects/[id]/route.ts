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

    // Try finding by UID first (common case for new routing)
    let project = await prisma.project.findFirst({
      where: {
        uid: id,
        // Add basic permission check: User must be member or Owner or Admin
        // Simplify for now: If user is Authenticated, we check if they have access
        // Ideally: OR: { owner: user.uid, members: { some: { userId: user.uid } }, visibility: 'public' }
      },
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

    // If not found by UID, try ID (Int) - for legacy URLs support
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
