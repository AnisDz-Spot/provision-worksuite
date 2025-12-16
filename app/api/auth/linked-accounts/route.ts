/**
 * OAuth Account Linking API
 *
 * Allows users to link/unlink OAuth providers to their existing account
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET - List linked accounts for the current user
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's numeric ID
    const user = await prisma.user.findUnique({
      where: { uid: authUser.uid },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find all linked accounts
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: accounts.map(
        (acc: {
          id: string;
          provider: string;
          providerAccountId: string;
          createdAt: Date;
        }) => ({
          id: acc.id,
          provider: acc.provider,
          providerId: acc.providerAccountId,
          linkedAt: acc.createdAt,
        })
      ),
    });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch linked accounts");
    return NextResponse.json(
      { error: "Failed to fetch linked accounts" },
      { status: 500 }
    );
  }
}

// DELETE - Unlink an OAuth account
export async function DELETE(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const provider = searchParams.get("provider");

    if (!accountId && !provider) {
      return NextResponse.json(
        { error: "accountId or provider required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { uid: authUser.uid },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count remaining accounts
    const accountCount = await prisma.account.count({
      where: { userId: user.id },
    });

    // Prevent unlinking if it's the only auth method and no password
    if (accountCount <= 1 && !user.passwordHash) {
      return NextResponse.json(
        {
          error:
            "Cannot unlink last authentication method. Set a password first.",
        },
        { status: 400 }
      );
    }

    // Delete the account
    const where = accountId
      ? { id: accountId, userId: user.id }
      : { userId: user.id, provider };

    await prisma.account.deleteMany({ where });

    log.info({ userId: authUser.uid, provider }, "OAuth account unlinked");

    return NextResponse.json({
      success: true,
      message: "Account unlinked successfully",
    });
  } catch (error) {
    log.error({ err: error }, "Failed to unlink account");
    return NextResponse.json(
      { error: "Failed to unlink account" },
      { status: 500 }
    );
  }
}
