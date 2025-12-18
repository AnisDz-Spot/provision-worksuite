import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(
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
    const user = await prisma.user.findUnique({
      where: { uid },
      select: {
        uid: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        phone: true,
        bio: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        created_at: user.createdAt,
      },
    });
  } catch (error: unknown) {
    log.error({ err: error, uid }, "Fetch user error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

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
    const {
      name,
      email,
      avatar_url,
      password,
      phone,
      bio,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
    } = body || {};

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (typeof name === "string") updateData.name = name.trim();
    if (typeof email === "string") updateData.email = email.trim();
    if (typeof avatar_url === "string") updateData.avatarUrl = avatar_url;
    if (typeof phone === "string") updateData.phone = phone.trim();
    if (typeof bio === "string") updateData.bio = bio.trim();
    if (typeof addressLine1 === "string")
      updateData.addressLine1 = addressLine1.trim();
    if (typeof addressLine2 === "string")
      updateData.addressLine2 = addressLine2.trim();
    if (typeof city === "string") updateData.city = city.trim();
    if (typeof state === "string") updateData.state = state.trim();
    if (typeof country === "string") updateData.country = country.trim();
    if (typeof postalCode === "string")
      updateData.postalCode = postalCode.trim();

    // Handle password update with hashing
    if (typeof password === "string" && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
      log.info({ uid }, "Password update requested");
    } else if (password && password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
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
        phone: true,
        bio: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        createdAt: true,
      },
    });

    log.info({ uid, updates: Object.keys(updateData) }, "User updated");

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        addressLine1: user.addressLine1,
        addressLine2: user.addressLine2,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        created_at: user.createdAt,
      },
    });
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
