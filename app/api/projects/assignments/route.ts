import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAdmin, isProjectManager } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fetch assignments (ProjectMembers)
    const [total, members] = await Promise.all([
      prisma.projectMember.count(),
      prisma.projectMember.findMany({
        skip,
        take: limit,
        include: {
          project: {
            select: { id: true, uid: true, name: true, slug: true },
          },
          user: {
            select: {
              id: true,
              uid: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          inviter: {
            select: { id: true, uid: true, name: true, email: true },
          },
        },
        orderBy: { joinedAt: "desc" },
      }),
    ]);

    // Calculate Task Time for each member in their respective project
    const assignmentsWithTime = await Promise.all(
      members.map(async (member: any) => {
        // Sum loggedHours from tasks assigned to this user in this project
        const aggregate = await prisma.task.aggregate({
          where: {
            projectId: member.project.uid, // Task links via project UID
            assigneeId: member.user.id,
          },
          _sum: {
            loggedHours: true,
          },
        });

        return {
          ...member,
          totalLoggedHours: aggregate._sum.loggedHours || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: assignmentsWithTime,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Assignments API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
