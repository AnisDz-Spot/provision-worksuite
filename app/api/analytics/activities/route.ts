import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const isAdmin = user.role === "admin" || user.role === "global-admin";
    const userUidInt = parseInt(user.uid) || 0;

    // Fetch recent tasks
    const tasks = await prisma.task.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { project: { userId: userUidInt } },
              { project: { members: { some: { userId: userUidInt } } } },
              { assigneeId: userUidInt },
            ],
          },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        assignee: { select: { name: true } },
      },
    });

    // Fetch recent projects
    const projects = await prisma.project.findMany({
      where: isAdmin
        ? { archivedAt: null }
        : {
            OR: [
              { userId: userUidInt },
              { members: { some: { userId: userUidInt } } },
            ],
            archivedAt: null,
          },
      take: 2,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        projects,
      },
    });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch dashboard activities");
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
