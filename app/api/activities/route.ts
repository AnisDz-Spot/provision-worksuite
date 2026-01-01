import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { recordActivity, EntityType } from "@/lib/activity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType");
    const limit = parseInt(searchParams.get("limit") || "20");

    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const where: any = {};
    if (entityId) where.entityId = entityId;
    if (entityType) where.entityType = entityType;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
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

    // Resolve Int ID from UID
    let dbUserId: number | null = null;

    // Check if we have the ID directly from the token/session
    if (currentUser.id && !isNaN(parseInt(currentUser.id))) {
      dbUserId = parseInt(currentUser.id);
    } else {
      // Look up in DB
      const dbUser = await prisma.user.findUnique({
        where: { uid: currentUser.uid },
        select: { id: true },
      });
      if (dbUser) {
        dbUserId = dbUser.id;
      }
    }

    if (!dbUserId) {
      // For Global Admin or users not in DB, we might skip logging or use a fallback
      // Since this is often test mode, we'll return success but log a warning
      console.warn(
        `[Activities] Skipping log for user ${currentUser.uid} (no DB ID found)`
      );
      return NextResponse.json({
        success: true,
        message: "Logged (mocked/skipped due to missing user in DB)",
      });
    }

    const activity = await recordActivity(
      dbUserId,
      entityType as EntityType,
      entityId,
      action,
      metadata
    );

    return NextResponse.json({
      success: !!activity,
      data: activity,
    });
  } catch (error) {
    console.error("Failed to create activity:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
