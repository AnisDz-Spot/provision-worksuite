import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch digest settings for current user
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user ID from database using uid
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let settings = await prisma.digestSettings.findUnique({
      where: { userId: dbUser.id },
    });

    // Return defaults if no settings exist
    if (!settings) {
      settings = {
        id: 0,
        userId: dbUser.id,
        enabled: false,
        dayOfWeek: 1,
        time: "09:00",
        recipients: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Error fetching digest settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch digest settings",
      },
      { status: 500 }
    );
  }
}

// POST - Save/update digest settings for current user
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user ID from database using uid
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { enabled, dayOfWeek, time, recipients } = body;

    // Validate input
    if (
      typeof enabled !== "boolean" ||
      typeof dayOfWeek !== "number" ||
      typeof time !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid input data" },
        { status: 400 }
      );
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        { success: false, error: "dayOfWeek must be between 0 and 6" },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipients)) {
      return NextResponse.json(
        { success: false, error: "recipients must be an array" },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await prisma.digestSettings.upsert({
      where: { userId: dbUser.id },
      update: {
        enabled,
        dayOfWeek,
        time,
        recipients,
      },
      create: {
        userId: dbUser.id,
        enabled,
        dayOfWeek,
        time,
        recipients,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    console.error("Error saving digest settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save digest settings",
      },
      { status: 500 }
    );
  }
}
