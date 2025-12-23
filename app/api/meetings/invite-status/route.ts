import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { inviteId, status } = await request.json();

    if (!inviteId || !["accepted", "rejected", "missed"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }

    const updatedInvite = await prisma.callInvite.update({
      where: { id: inviteId },
      data: { status },
    });

    log.info({ inviteId, status }, "Call invite updated");

    return NextResponse.json({ success: true, data: updatedInvite });
  } catch (error) {
    log.error({ err: error }, "Invite status update error");
    return NextResponse.json(
      { success: false, error: "Failed to update invite" },
      { status: 500 }
    );
  }
}
