import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        project: {
          select: {
            uid: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    log.info({ count: invoices.length }, "Fetched invoices");

    return NextResponse.json({ success: true, data: invoices });
  } catch (error) {
    log.error({ err: error }, "Get invoices error");
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, clientName, issueDate, dueDate, status, items, total } =
      body;

    if (
      !projectId ||
      !clientName ||
      !issueDate ||
      !dueDate ||
      !items ||
      !total
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const uid = `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const invoice = await prisma.invoice.create({
      data: {
        uid,
        projectId,
        clientName,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status: status || "draft",
        items,
        total: parseFloat(total),
      },
      include: {
        project: true,
      },
    });

    log.info({ invoiceId: invoice.id, projectId, total }, "Invoice created");

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    log.error({ err: error }, "Create invoice error");
    return NextResponse.json(
      { success: false, error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
