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

    // Resolve project ID
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

    const files = await prisma.file.findMany({
      where: { projectId: project.id },
      include: {
        uploader: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: files });
  } catch (error) {
    console.error("Fetch files error:", error);
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

    const { id } = await params;

    // Resolve project ID
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

    const body = await request.json();
    const { name, url, size, type } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Resolve numeric ID from UID
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User record not found" },
        { status: 404 }
      );
    }

    const file = await prisma.file.create({
      data: {
        filename: name,
        fileUrl: url,
        fileSize: size || 0,
        mimeType: type || "application/octet-stream",
        projectId: project.id,
        uploadedBy: dbUser.id,
      },
      include: {
        uploader: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: file });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
