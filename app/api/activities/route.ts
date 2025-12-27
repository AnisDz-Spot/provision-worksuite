import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_ACTIVITIES } from "@/lib/mock-data";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // In demo mode or for global admin, return mock activities
    if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
      return NextResponse.json({
        success: true,
        activities: MOCK_ACTIVITIES,
        source: "mock",
      });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "ProjectId is required" },
        { status: 400 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: {
        entityType: "project",
        entityId: projectId,
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch activities");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entityType, entityId, action, metadata } = body;

    if (!entityType || !entityId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch DB user ID
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

    const activity = await prisma.activity.create({
      data: {
        userId: dbUser.id,
        entityType,
        entityId,
        action,
        metadata: metadata || {},
      },
    });

    return NextResponse.json({ success: true, activity });
  } catch (error) {
    log.error({ err: error }, "Failed to create activity");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
