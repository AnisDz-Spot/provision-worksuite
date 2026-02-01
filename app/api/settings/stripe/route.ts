import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Retrieve Stripe settings (Admin only)
 * Masks the Secret Key for security.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get DB user to find tenantId
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { tenantId: true },
    });

    const tenantId = dbUser?.tenantId;

    // Find Gateway Config
    const gateway = await prisma.paymentGateway.findFirst({
      where: {
        tenantId: tenantId || null,
        provider: "stripe",
      },
    });

    if (!gateway) {
      return NextResponse.json({
        success: true,
        data: {
          isEnabled: false,
          apiKey: "",
          publicKey: "",
          webhookSecret: "",
        },
      });
    }

    const data = {
      isEnabled: gateway.isEnabled,
      apiKey: "",
      publicKey: gateway.publicKey || "",
      webhookSecret: "",
    };

    // Decrypt and mask Secret Key
    if (gateway.apiKey) {
      const value = decrypt(gateway.apiKey);
      if (value) {
        if (value.length > 8) {
          data.apiKey =
            value.substring(0, 4) +
            "****************" +
            value.substring(value.length - 4);
        } else {
          data.apiKey = "****************";
        }
      }
    }

    // Decrypt and mask Webhook Secret
    if (gateway.webhookSecret) {
      const value = decrypt(gateway.webhookSecret);
      if (value) {
        if (value.length > 8) {
          data.webhookSecret =
            value.substring(0, 4) +
            "****************" +
            value.substring(value.length - 4);
        } else {
          data.webhookSecret = "****************";
        }
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Stripe settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Update Stripe settings (Admin only)
 * Encrypts sensitive fields before storing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get DB user to find tenantId
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { tenantId: true },
    });

    const tenantId = dbUser?.tenantId;

    const body = await req.json();
    const { isEnabled, apiKey, publicKey, webhookSecret } = body;

    // Find existing gateway or create new one
    const existing = await prisma.paymentGateway.findFirst({
      where: {
        tenantId: tenantId || null,
        provider: "stripe",
      },
    });

    const data: any = {
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      publicKey: publicKey || "",
      provider: "stripe",
      tenantId: tenantId || null,
    };

    // Only update apiKey if it's not empty and not masked
    if (apiKey && !apiKey.includes("****************")) {
      data.apiKey = encrypt(apiKey);
    } else if (!existing && !apiKey) {
      return NextResponse.json(
        { error: "Secret Key is required for new configurations" },
        { status: 400 },
      );
    }

    // Only update webhookSecret if it's not empty and not masked
    if (webhookSecret && !webhookSecret.includes("****************")) {
      data.webhookSecret = encrypt(webhookSecret);
    } else if (webhookSecret === "") {
      data.webhookSecret = null;
    }

    if (existing) {
      await prisma.paymentGateway.update({
        where: { id: existing.id },
        data,
      });
    } else {
      // For create, apiKey is mandatory if provided
      if (!data.apiKey) {
        data.apiKey = ""; // Should have been caught above but just in case
      }
      await prisma.paymentGateway.create({
        data,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Stripe settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating Stripe settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
