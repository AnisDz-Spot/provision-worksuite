import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  try {
    const sprints = await prisma.sprint.findMany({
      where: projectId ? { projectId } : {},
      include: {
        tasks: {
          select: {
            uid: true,
            title: true,
            status: true,
            priority: true,
            storyPoints: true,
            assignee: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { number: "desc" },
    });

    return NextResponse.json({ success: true, data: sprints });
  } catch (error) {
    console.error("Failed to fetch sprints:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { projectId, number, name, startDate, endDate, goal, tasks } = body;

    const sprint = await prisma.sprint.create({
      data: {
        projectId,
        number,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        goal,
        tasks: tasks
          ? {
              connect: tasks.map((id: string) => ({ uid: id })),
            }
          : undefined,
      },
    });

    return NextResponse.json({ success: true, data: sprint });
  } catch (error) {
    console.error("Failed to create sprint:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
