import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdentifier, pageId } = await params;
    const body = await request.json();

    if (!shouldUseDatabaseData()) {
      return NextResponse.json({
        success: true,
        page: { ...body, id: pageId },
      });
    }

    // Resolve Project
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ uid: projectIdentifier }, { slug: projectIdentifier }],
      },
      select: { id: true, members: { select: { userId: true } }, userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Permission Check
    // AuthUser.id is a string, but DB stores userId as Int. We try to match either.
    const userIdNum = user.id ? parseInt(user.id) : -1;
    const isMember = project.members.some((m: any) => m.userId === userIdNum);
    const isOwner = project.userId === userIdNum;
    const isUserAdmin = isAdmin(user);

    if (!isMember && !isOwner && !isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify Page belongs to Project
    const existingPage = await prisma.wikiPage.findUnique({
      where: { id: pageId },
    });

    if (!existingPage || existingPage.projectId !== project.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const updatedPage = await prisma.wikiPage.update({
      where: { id: pageId },
      data: {
        title: body.title,
        content: body.content,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ page: updatedPage });
  } catch (error) {
    console.error("Error updating wiki page:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdentifier, pageId } = await params;

    if (!shouldUseDatabaseData()) {
      return NextResponse.json({ success: true });
    }

    // Resolve Project
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ uid: projectIdentifier }, { slug: projectIdentifier }],
      },
      select: { id: true, members: { select: { userId: true } }, userId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Permission Check
    // AuthUser.id is a string, but DB stores userId as Int. We try to match either.
    const userIdNum = user.id ? parseInt(user.id) : -1;
    const isMember = project.members.some((m: any) => m.userId === userIdNum);
    const isOwner = project.userId === userIdNum;
    const isUserAdmin = isAdmin(user);

    if (!isMember && !isOwner && !isUserAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify Page belongs to Project
    const existingPage = await prisma.wikiPage.findUnique({
      where: { id: pageId },
    });

    if (!existingPage || existingPage.projectId !== project.id) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await prisma.wikiPage.delete({
      where: { id: pageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wiki page:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
