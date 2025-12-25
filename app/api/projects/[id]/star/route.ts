import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { revalidateTag } from "next/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: projectIdStr } = await params;

    // Find internal Int ID if UUID was passed
    let projectId: number;
    if (isNaN(Number(projectIdStr))) {
      const project = await prisma.project.findUnique({
        where: { uid: projectIdStr },
        select: { id: true },
      });
      if (!project)
        return new NextResponse("Project not found", { status: 404 });
      projectId = project.id;
    } else {
      projectId = parseInt(projectIdStr);
    }

    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });
    if (!dbUser) return new NextResponse("User not found", { status: 404 });

    // Toggle Star
    const existingStar = await prisma.starredProject.findUnique({
      where: {
        userId_projectId: {
          userId: dbUser.id,
          projectId: projectId,
        },
      },
    });

    if (existingStar) {
      await prisma.starredProject.delete({
        where: { id: existingStar.id },
      });
    } else {
      await prisma.starredProject.create({
        data: {
          userId: dbUser.id,
          projectId: projectId,
        },
      });
    }

    // Clear cache
    (revalidateTag as any)("projects");

    return NextResponse.json({ success: true, starred: !existingStar });
  } catch (error) {
    console.error("Star toggle error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
