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

    // 1. Parse Multipart/Form-Data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Validate File Content (Magic Bytes)
    const { validateFile, processImage } = await import("@/lib/security-utils");
    let buffer = Buffer.from((await file.arrayBuffer()) as any);

    // Avatars MUST be images
    const validation = await validateFile(buffer, file.type);

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 415 }); // 415 Unsupported Media Type
    }

    // 3. Re-encode images to neutralize payloads and strip metadata
    let finalMime = validation.mimeType || file.type;
    if (finalMime.startsWith("image/")) {
      try {
        buffer = await processImage(buffer);
        finalMime = "image/webp"; // Normalizing to WebP
      } catch (e) {
        console.error("Image processing failed:", e);
        // Fallback to original buffer if processing fails but validation passed?
        // Actually, for maximum security, if processing fails we should probably reject.
        return NextResponse.json(
          { error: "Failed to process image safely." },
          { status: 422 }
        );
      }
    }

    // 4. Resolve numeric ID from UID
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

    // Convert to Data URL for database storage (preserving current architecture)
    const dataUrl = `data:${finalMime};base64,${buffer.toString("base64")}`;

    const createdFile = await prisma.file.create({
      data: {
        filename:
          file.name.replace(/\.[^/.]+$/, "") +
          (finalMime === "image/webp" ? ".webp" : ""),
        fileUrl: dataUrl,
        fileSize: buffer.length,
        mimeType: finalMime,
        projectId: project.id,
        uploadedBy: dbUser.id,
      },
      include: {
        uploader: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: createdFile });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
