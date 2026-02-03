import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch comprehensive portfolio data
    const [projects, totalStats] = await Promise.all([
      prisma.project.findMany({
        where: { archived: false },
        select: {
          id: true,
          name: true,
          status: true,
          progress: true,
          deadline: true,
          budget: true,
          expenses: {
            select: { amount: true },
          },
          _count: {
            select: {
              tasks: true,
              milestones: true,
            },
          },
        },
      }),
      prisma.project.aggregate({
        where: { archived: false },
        _sum: { budget: true },
        _count: { id: true },
      }),
    ]);

    // 2. Process data for the report
    const reportData = projects.map((p: any) => {
      const totalSpent = p.expenses.reduce(
        (sum: number, e: any) => sum + Number(e.amount),
        0,
      );
      const budgetUtilization =
        p.budget > 0 ? (totalSpent / Number(p.budget)) * 100 : 0;

      return {
        name: p.name,
        status: p.status,
        progress: p.progress,
        deadline: p.deadline,
        budget: Number(p.budget),
        spent: totalSpent,
        utilization: budgetUtilization.toFixed(1),
        taskCount: p._count.tasks,
        milestoneCount: p._count.milestones,
      };
    });

    const summary = {
      totalProjects: totalStats._count.id,
      totalBudget: Number(totalStats._sum.budget || 0),
      overallProgress:
        projects.length > 0
          ? projects.reduce((sum: number, p: any) => sum + p.progress, 0) /
            projects.length
          : 0,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        projects: reportData,
        summary,
      },
    });
  } catch (error) {
    console.error("Portfolio Snapshot Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
