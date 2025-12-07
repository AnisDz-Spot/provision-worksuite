import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        project: {
          select: {
            uid: true,
            name: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    log.info({ count: expenses.length }, "Fetched expenses");

    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    log.error({ err: error }, "Get expenses error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, date, vendor, amount, note } = body;

    if (!projectId || !date || !amount) {
      return NextResponse.json(
        { success: false, error: "projectId, date, and amount are required" },
        { status: 400 }
      );
    }

    const uid = `expense_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const expense = await prisma.expense.create({
      data: {
        uid,
        projectId,
        date: new Date(date),
        vendor: vendor || null,
        amount: parseFloat(amount),
        note: note || null,
      },
      include: {
        project: true,
      },
    });

    log.info({ expenseId: expense.id, projectId, amount }, "Expense created");

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    log.error({ err: error }, "Create expense error");
    return NextResponse.json(
      { success: false, error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
