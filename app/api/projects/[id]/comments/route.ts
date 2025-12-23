import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Resolve Project ID (handle Slug/UID)
  // We re-use logic or just do a findFirst.
  const project = await prisma.project.findFirst({
    where: {
      OR: [
        { uid: id },
        { slug: id },
        {
          id: id /* if id is used as string but actually it's int in DB? No, ID is Int */,
        },
      ],
    },
    select: { id: true },
  });

  // If ID is int (legacy URL support), we might need to parse.
  // But our route is `[id]`.
  // Safer to try finding by UID/Slug.
  // If not found, try parsing int.
  let projectIdInt = project?.id;

  if (!projectIdInt) {
    const parsed = parseInt(id);
    if (!isNaN(parsed)) {
      const p2 = await prisma.project.findUnique({
        where: { id: parsed },
        select: { id: true },
      });
      if (p2) projectIdInt = p2.id;
    }
  }

  if (!projectIdInt) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  try {
    const comments = await prisma.comment.findMany({
      where: { projectId: projectIdInt },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Resolve Project ID
  const project = await prisma.project.findFirst({
    where: { OR: [{ uid: id }, { slug: id }] },
    select: { id: true },
  });

  let projectIdInt = project?.id;
  if (!projectIdInt) {
    const parsed = parseInt(id);
    if (!isNaN(parsed)) {
      const p2 = await prisma.project.findUnique({
        where: { id: parsed },
        select: { id: true },
      });
      if (p2) projectIdInt = p2.id;
    }
  }

  if (!projectIdInt) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content is required" },
        { status: 400 }
      );
    }

    const userRecord = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!userRecord) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        projectId: projectIdInt,
        userId: userRecord.id,
      },
      include: {
        user: {
          select: {
            uid: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("Failed to create comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
