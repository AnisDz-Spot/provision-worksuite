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
        createdById: parseInt(currentUser.uid),
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
