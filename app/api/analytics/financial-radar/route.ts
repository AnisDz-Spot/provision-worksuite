import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Aggregate project budgets
    const projects = await prisma.project.findMany({
      select: {
        budget: true,
        expenses: {
          select: {
            amount: true,
          },
        },
        invoices: {
          select: {
            total: true,
            status: true,
          },
        },
      },
    });

    const stats = projects.reduce(
      (acc: any, p: any) => {
        const projectBudget = Number(p.budget) || 0;
        const projectExpenses = p.expenses.reduce(
          (sum: number, e: any) => sum + Number(e.amount),
          0,
        );
        const projectPaid = p.invoices
          .filter((i: any) => i.status === "paid")
          .reduce((sum: number, i: any) => sum + Number(i.total), 0);
        const projectPending = p.invoices
          .filter((i: any) => i.status !== "paid")
          .reduce((sum: number, i: any) => sum + Number(i.total), 0);

        return {
          totalBudget: acc.totalBudget + projectBudget,
          totalSpent: acc.totalSpent + projectExpenses,
          totalInvoiced: acc.totalInvoiced + projectPaid + projectPending,
          totalPaid: acc.totalPaid + projectPaid,
        };
      },
      { totalBudget: 0, totalSpent: 0, totalInvoiced: 0, totalPaid: 0 },
    );

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Financial Radar API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial radar data" },
      { status: 500 },
    );
  }
}
