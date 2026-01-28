import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { decrypt } from "@/lib/encryption";
// Minimal stripe client for signature verification initialization (no secret needed initially just for types?)
// Actually we need the real client or just the library construct to verify signature using the secret.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> }, // Params are async in Next.js 15
) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;
  const { tenantId } = await params;

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    // 1. Fetch Tenant Config for Webhook Secret
    // If tenantId is "system", we look for null tenant.
    // Assuming route is /api/webhooks/stripe/[tenantId]

    const dbTenantId = tenantId === "system" ? null : tenantId;

    let gateway = await prisma.paymentGateway.findFirst({
      where: {
        tenantId: dbTenantId,
        provider: "stripe",
        isEnabled: true,
      },
    });

    // Fallback logic similar to client factory if needed, but for webhooks usually strict.
    // If we receive a webhook at a specific tenant URL, we expect that tenant config.

    if (!gateway || !gateway.webhookSecret) {
      console.error(
        `Webhook Error: No configuration found for tenant ${tenantId}`,
      );
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 },
      );
    }

    const webhookSecret = decrypt(gateway.webhookSecret);
    if (!webhookSecret) {
      return NextResponse.json(
        { error: "Invalid configuration" },
        { status: 500 },
      );
    }

    // 2. Verify Signature
    // We can use the global Stripe class for this utility without an instance if strictly verifying
    // or instantiate a fresh client.
    let event: Stripe.Event;

    try {
      // Need a Stripe instance to access webhooks.constructEvent properly or import it statically?
      // "import Stripe from 'stripe'" is the class.
      // Stripe.webhooks.constructEvent usually requires an instance in strict TS or usage of the default export constructor.
      // Let's instantiate a lightweight client.
      const stripeClient = new Stripe("dummy", {
        apiVersion: "2025-01-27.acacia" as any,
      });
      // API Key doesn't matter for signature verification, only secret.

      event = stripeClient.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      console.error(`Webhook Signature Verification Failed: ${err.message}`);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 },
      );
    }

    // 3. Handle Event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve Invoice ID from metadata or client_reference_id
      const invoiceId =
        session.metadata?.invoiceId || session.client_reference_id;

      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "paid",
            // Optionally store payment intent ID or other metadata
            notes: {
              // Append note? Or simple replace? Schema is String?
              // Let's assume we don't overwrite notes blindly if they exist.
              // For now, simple status update.
            },
          },
        });
        console.log(`Invoice ${invoiceId} marked as paid.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
