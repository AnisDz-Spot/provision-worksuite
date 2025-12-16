import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const { uid } = await context.params;
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Missing user id" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, avatar_url } = body || {};

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (typeof email === "string" && email.trim()) {
      updateData.email = email.trim();
    }
    if (typeof avatar_url === "string") {
      updateData.avatarUrl = avatar_url;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update user with Prisma
    const user = await prisma.user.update({
      where: { uid },
      data: updateData,
      select: {
        uid: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    // Map to frontend expectations
    const mappedUser = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      avatar_url: user.avatarUrl,
      role: user.role,
      created_at: user.createdAt,
    };

    log.info({ uid, updates: Object.keys(updateData) }, "User updated");

    return NextResponse.json({ success: true, data: mappedUser });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    log.error({ err: error, uid }, "Update user error");
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
