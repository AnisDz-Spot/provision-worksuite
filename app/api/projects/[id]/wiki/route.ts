import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdentifier } = await params;

    if (!shouldUseDatabaseData()) {
      // Return mock data if needed, or just empty
      return NextResponse.json({ pages: [] });
    }

    // Resolve Project ID
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ uid: projectIdentifier }, { slug: projectIdentifier }],
      },
      select: {
        id: true,
        members: { select: { userId: true } },
        userId: true,
        visibility: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Access Check (Basic: Public, or Member, or Owner)
    const isMember = project.members.some((m) => m.userId === user.id);
    const isOwner = project.userId === user.id;
    if (project.visibility === "private" && !isMember && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pages = await prisma.wikiPage.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching wiki pages:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdentifier } = await params;
    const body = await request.json();

    if (!shouldUseDatabaseData()) {
      return NextResponse.json({
        success: true,
        page: { ...body, id: "mock-id" },
      });
    }

    // Resolve Project
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ uid: projectIdentifier }, { slug: projectIdentifier }],
      },
      select: {
        id: true,
        members: { select: { userId: true, role: true } },
        userId: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Access Check (Basic: Public, or Member, or Owner)
    // AuthUser.id is a string, but DB stores userId as Int. We try to match either.
    const userIdNum = user.id ? parseInt(user.id) : -1;
    const isMember = project.members.some((m: any) => m.userId === userIdNum);
    const isOwner = project.userId === userIdNum;

    // Only members or owner can create pages
    if (!isMember && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You must be a project member" },
        { status: 403 }
      );
    }

    const page = await prisma.wikiPage.create({
      data: {
        title: body.title,
        content: body.content,
        parentId: body.parentId || null,
        projectId: project.id,
        isPublished: true,
      },
    });

    return NextResponse.json({ page });
  } catch (error: any) {
    console.error("Error creating wiki page:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
