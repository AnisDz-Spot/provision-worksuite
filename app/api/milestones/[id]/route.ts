import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch before delete for metadata
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });

    if (milestone) {
      // Fetch DB user for Integer ID
      const dbUser = await prisma.user.findUnique({
        where: { uid: user.uid },
        select: { id: true },
      });

      if (dbUser) {
        const { recordActivity } = await import("@/lib/activity");
        await recordActivity(dbUser.id, "milestone", id, "deleted", {
          title: milestone.name,
          projectId: milestone.project.uid,
        });
      }
    }

    await prisma.milestone.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Milestone deleted" });
  } catch (error) {
    log.error({ err: error }, "Failed to delete milestone");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
