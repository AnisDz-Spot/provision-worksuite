import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { subDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user as any)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch data for active projects with budgets
    const projects = await prisma.project.findMany({
      where: {
        archived: false,
        status: { notIn: ["completed", "cancelled"] },
        budget: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        budget: true,
        deadline: true,
        createdAt: true,
        expenses: {
          select: {
            amount: true,
            date: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 2. Calculate forecasts
    const thirtyDaysAgo = subDays(new Date(), 30);

    const forecasts = projects.map((p: any) => {
      const budget = Number(p.budget);
      const totalSpent = p.expenses.reduce(
        (sum: number, e: any) => sum + Number(e.amount),
        0,
      );
      const remainingBudget = budget - totalSpent;

      // Calculate Recent Burn Rate (last 30 days)
      const recentExpenses = p.expenses.filter(
        (e: any) => new Date(e.date) >= thirtyDaysAgo,
      );
      const recentTotal = recentExpenses.reduce(
        (sum: number, e: any) => sum + Number(e.amount),
        0,
      );
      const dailyBurnRate = recentTotal / 30;

      // Project Exhaustion Date
      let exhaustionDate = null;
      if (dailyBurnRate > 0) {
        const daysToExhaustion = remainingBudget / dailyBurnRate;
        exhaustionDate = new Date();
        exhaustionDate.setDate(
          exhaustionDate.getDate() + Math.floor(daysToExhaustion),
        );
      }

      // Predicted Overage at Deadline
      let predictedOverage = 0;
      const targetDeadline = new Date(p.deadline);
      const daysUntilDeadline = Math.max(
        0,
        Math.floor(
          (targetDeadline.getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      const predictedFutureSpend = dailyBurnRate * daysUntilDeadline;
      const predictedTotalSpend = totalSpent + predictedFutureSpend;

      if (predictedTotalSpend > budget) {
        predictedOverage = predictedTotalSpend - budget;
      }

      const riskLevel =
        predictedTotalSpend > budget * 1.1
          ? "high"
          : predictedTotalSpend > budget
            ? "medium"
            : "low";

      return {
        projectId: p.id,
        projectName: p.name,
        budget,
        totalSpent,
        remainingBudget,
        dailyBurnRate: dailyBurnRate.toFixed(2),
        exhaustionDate: exhaustionDate?.toISOString(),
        predictedOverage: predictedOverage.toFixed(2),
        predictedTotalSpend: predictedTotalSpend.toFixed(2),
        riskLevel,
        isOverBudget: totalSpent > budget,
      };
    });

    return NextResponse.json({ success: true, data: forecasts });
  } catch (error) {
    console.error("Budget Forecast Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
