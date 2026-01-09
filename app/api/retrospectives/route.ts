import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData, shouldReturnMockData } from "@/lib/auth-utils";

const MOCK_RETRO = [
  {
    id: "retro-1",
    title: "Sprint 1 Retro",
    date: new Date().toISOString(),
    wentWell: [],
    needsImprovement: [],
    actionItems: [],
  },
];

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json(MOCK_RETRO);
    }

    const retrieved = await prisma.retrospective.findMany({
      orderBy: { date: "desc" },
    });

    return NextResponse.json(retrieved);
  } catch (error) {
    console.error("Failed to fetch retrospectives:", error);
    return NextResponse.json(
      { error: "Failed to fetch retrospectives" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Master Admin, Admin, and Project Manager can save retrospectives
    const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json(
        {
          error: "Forbidden: You do not have permission to save retrospectives",
        },
        { status: 403 }
      );
    }

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const data = await req.json();

    if (data.id && !data.id.startsWith("retro-")) {
      const updated = await prisma.retrospective.update({
        where: { id: data.id },
        data: {
          title: data.title,
          date: new Date(data.date),
          sprintNumber: data.sprintNumber,
          projectId: data.projectId,
          attendees: data.attendees,
          wentWell: data.wentWell,
          needsImprovement: data.needsImprovement,
          actionItems: data.actionItems,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    const created = await prisma.retrospective.create({
      data: {
        title: data.title,
        date: new Date(data.date),
        sprintNumber: data.sprintNumber,
        projectId: data.projectId,
        attendees: data.attendees || [],
        wentWell: data.wentWell || [],
        needsImprovement: data.needsImprovement || [],
        actionItems: data.actionItems || [],
        createdBy: user.uid,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Failed to save retrospective:", error);
    return NextResponse.json(
      { error: "Failed to save retrospective" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only Master Admin, Admin, and Project Manager can delete retrospectives
    const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to delete retrospectives",
        },
        { status: 403 }
      );
    }

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.retrospective.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete retrospective:", error);
    return NextResponse.json(
      { error: "Failed to delete retrospective" },
      { status: 500 }
    );
  }
}
