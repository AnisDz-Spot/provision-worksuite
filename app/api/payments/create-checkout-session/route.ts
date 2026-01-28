import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, projectId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID required" },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { project: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get Tenant context from User
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true },
    });

    // We expect dbUser to exist if authenticated, but safe check
    const tenantId = dbUser?.tenantId || undefined;

    // Get Stripe Client
    let stripe;
    try {
      stripe = await getStripeClient(tenantId ? tenantId : undefined);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Create Line Items
    // Invoice items are stored as JSON. We need to cast it safely.
    // Assuming simple structure { description, quantity, rate }
    const items = (invoice.items as any) || [];
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.description || "Project Service",
        },
        unit_amount: Math.round(Number(item.rate) * 100), // cents
      },
      quantity: Number(item.quantity) || 1,
    }));

    if (line_items.length === 0) {
      // Fallback for empty or legacy invoices
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Invoice #${invoice.uid || invoice.id}` },
          unit_amount: Math.round(invoice.total * 100),
        },
        quantity: 1,
      });
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${origin}/projects/${invoice.projectId}?tab=invoices&payment=success&invoice=${invoice.id}`,
      cancel_url: `${origin}/projects/${invoice.projectId}?tab=invoices&payment=cancelled`,
      metadata: {
        invoiceId: invoice.id,
        projectId: String(invoice.projectId),
        tenantId: tenantId || "",
      },
      client_reference_id: invoice.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
