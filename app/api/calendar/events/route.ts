import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json({ success: true, data: [], source: "demo" });
  }

  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Global Admin Bypass (Mock Mode)
  if (
    currentUser.uid === "admin-global" ||
    currentUser.email === "admin@provision.com"
  ) {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return NextResponse.json({
      success: true,
      data: [
        {
          id: "evt_mock_1",
          title: "Daily Standup",
          description: "Team status update",
          startTime: new Date(today.getTime() + 10 * 3600000).toISOString(), // 10:00 AM Today
          endTime: new Date(today.getTime() + 10.5 * 3600000).toISOString(), // 10:30 AM Today
          type: "meeting",
          color: "#3b82f6",
          isAllDay: false,
          createdById: 0,
        },
        {
          id: "evt_mock_2",
          title: "Project Review",
          description: "Review Q1 milestones",
          startTime: new Date(today.getTime() + 14 * 3600000).toISOString(), // 2:00 PM Today
          endTime: new Date(today.getTime() + 15 * 3600000).toISOString(), // 3:00 PM Today
          type: "task",
          color: "#10b981",
          isAllDay: false,
          createdById: 0,
        },
        {
          id: "evt_mock_3",
          title: "Client Call",
          description: "Requirements gathering with Acme Corp",
          startTime: new Date(tomorrow.getTime() + 11 * 3600000).toISOString(), // 11:00 AM Tomorrow
          endTime: new Date(tomorrow.getTime() + 12 * 3600000).toISOString(), // 12:00 PM Tomorrow
          type: "meeting",
          color: "#8b5cf6",
          isAllDay: false,
          createdById: 0,
        },
        {
          id: "evt_mock_4",
          title: "Deadline: Website Redesign",
          description: "Final submission",
          startTime: new Date(today.getTime() + 17 * 3600000).toISOString(), // 5:00 PM Today
          endTime: new Date(today.getTime() + 18 * 3600000).toISOString(), // 6:00 PM Today
          type: "milestone",
          color: "#ef4444",
          isAllDay: false,
          createdById: 0,
        },
      ],
      source: "demo",
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const events = await prisma.calendarEvent.findMany({
      where: {
        createdById: parseInt(currentUser.uid),
        // Filter by date range if provided
        ...(start && end
          ? {
              startTime: {
                gte: new Date(start),
                lte: new Date(end),
              },
            }
          : {}),
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    log.error({ err: error }, "Get calendar events error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Global Admin Bypass (Mock Mode) - Prevent write but return success/mock
  if (
    currentUser.uid === "admin-global" ||
    currentUser.email === "admin@provision.com"
  ) {
    return NextResponse.json({
      success: true,
      data: {
        id: "evt_demo_" + Date.now(),
        title: "Demo Event",
        description: "This is a demo event",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        type: "event",
        color: "#3b82f6",
        isAllDay: false,
        createdById: 0,
      },
    });
  }

  // Check for Global Admin (string ID) trying to write to DB (requires Int ID)
  const userId = parseInt(currentUser.uid);
  if (isNaN(userId)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Demo accounts cannot save to the database. Please create a real account.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { title, description, startTime, endTime, type, color, isAllDay } =
      body;

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : new Date(startTime),
        type: type || "event",
        color: color || "#3b82f6",
        isAllDay: isAllDay || false,
        createdById: userId,
      },
    });

    return NextResponse.json({ success: true, data: event });
  } catch (error) {
    log.error({ err: error }, "Create calendar event error");
    return NextResponse.json(
      { success: false, error: "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const currentUser = await getAuthenticatedUser();
  if (!currentUser) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Global Admin Bypass (Mock Mode)
  if (
    currentUser.uid === "admin-global" ||
    currentUser.email === "admin@provision.com"
  ) {
    return NextResponse.json({ success: true });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID required" },
        { status: 400 }
      );
    }

    await prisma.calendarEvent.delete({
      where: {
        id: id,
        createdById: parseInt(currentUser.uid), // Ensure ownership
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error }, "Delete calendar event error");
    return NextResponse.json(
      { success: false, error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
