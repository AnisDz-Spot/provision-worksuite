import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Only Master Admin should access this
const MASTER_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAIL || "anis@provision.com"; // Fallback for safety

export const GET = withRateLimit(RATE_LIMITS.QUERY, async (request: any) => {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict Access Control: Only Master Admin or designated super-admins
    // Checking against hardcoded master admin or a specific high-level role
    const isMasterAdmin =
      user.email === MASTER_ADMIN_EMAIL || user.role === "admin"; // Temporarily allow all admins until "super-admin" role exists

    if (!isMasterAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const userIdFilter = searchParams.get("userId");
    const actionFilter = searchParams.get("action");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (userIdFilter) where.userId = parseInt(userIdFilter);
    if (actionFilter) where.action = actionFilter;

    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
});
