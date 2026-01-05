import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData, shouldReturnMockData } from "@/lib/auth-utils";

// Mock data (fallback)
const MOCK_MEETINGS = [
  {
    id: "meeting-1",
    title: "Project Kickoff",
    date: new Date().toISOString(),
    content: "<p>Discussed scope and timeline.</p>",
    attendees: ["John Doe", "Jane Smith"],
    projectId: "PROJ-101",
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
      return NextResponse.json(MOCK_MEETINGS);
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where = projectId ? { projectId } : {};

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { createdAt: "desc" }, // Use createdAt or date? app/meetings uses date
      // Note: prisma.meeting 'date' field was added as DateTime?
    });

    // Map DB fields to frontend expected format
    const formatted = meetings.map((m: any) => ({
      id: m.id,
      title: m.title,
      date: m.date
        ? m.date.toISOString()
        : m.startTime?.toISOString() || new Date().toISOString(),
      projectId: m.projectId,
      content: m.content || "",
      attendees: m.attendees || [],
      // actionItems stored as Json, cast to any
      actionItems: (m.actionItems as any) || [],
      createdBy: m.createdBy,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to fetch meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
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

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({ success: true, id: "mock-id" });
    }

    const data = await req.json();

    if (data.id && !data.id.startsWith("meeting-")) {
      const updated = await prisma.meeting.update({
        where: { id: data.id },
        data: {
          title: data.title,
          date: data.date ? new Date(data.date) : undefined,
          startTime: data.date ? new Date(data.date) : undefined,
          content: data.content,
          projectId: data.projectId || undefined,
          attendees: data.attendees || [],
          actionItems: data.actionItems || [],
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // Create Meeting
    const roomId = crypto.randomUUID();

    const meeting = await prisma.meeting.create({
      data: {
        roomId,
        title: data.title,
        date: data.date ? new Date(data.date) : undefined,
        startTime: data.date ? new Date(data.date) : undefined,
        content: data.content,
        projectId: data.projectId || undefined,
        attendees: data.attendees || [],
        actionItems: data.actionItems || [],
        createdBy: user.uid,
        type: "note",
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Failed to save meeting:", error);
    return NextResponse.json(
      { error: "Failed to save meeting" },
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

    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.meeting.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meeting:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting" },
      { status: 500 }
    );
  }
}
