import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { log } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only elevated users can trigger maintenance
    const allowedRoles = [
      "admin",
      "global-admin",
      "Administrator",
      "Master Admin",
      "Project Manager",
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedCount = await prisma.message.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    log.info(
      { deletedCount: deletedCount.count },
      "90-day message cleanup performed"
    );

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount.count} old messages`,
      count: deletedCount.count,
    });
  } catch (error) {
    log.error({ err: error }, "Message cleanup failed");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
