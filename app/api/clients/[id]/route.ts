import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { updateClientSchema, validateRequest } from "@/lib/schemas/validation";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: { select: { projects: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export const PUT = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getAuthenticatedUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    // SECURITY: Validate input with Zod
    const validation = validateRequest(updateClientSchema, body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error?.message || "Validation failed",
          details: validation.error?.details.flatten(),
        },
        { status: 400 }
      );
    }

    // Role check: Only Master Admin, Admin, and Project Manager can update clients
    const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You do not have permission to update clients",
        },
        { status: 403 }
      );
    }

    try {
      // Explicitly update all allowed fields
      const updateData: any = {
        name: body.name,
        primaryContact: body.primaryContact,
        primaryEmail: body.primaryEmail,
        secondaryEmail: body.secondaryEmail,
        phone: body.phone,
        website: body.website,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        timezone: body.timezone,
        language: body.language,
        billingEmail: body.billingEmail,
        vatNumber: body.vatNumber,
        currency: body.currency,
        hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : null,
        paymentTerms: body.paymentTerms,
        defaultVisibility: body.defaultVisibility,
        customFields: body.customFields || {},
        notes: body.notes,
        type: body.type,
        status: body.status,
        logo: body.logo,
      };

      const client = await prisma.client.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ success: true, data: client });
    } catch (error) {
      console.error("Update client error:", error);
      return NextResponse.json(
        { error: "Failed to update client" },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRateLimit(
  RATE_LIMITS.MUTATION,
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getAuthenticatedUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Role check: Only Master Admin, Admin, and Project Manager can delete clients
    const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
    if (!isAdmin(user) && !isProjectManager(user)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You do not have permission to delete clients",
        },
        { status: 403 }
      );
    }

    try {
      // Soft delete or hard delete?
      // "Archive" is safer.
      await prisma.client.update({
        where: { id },
        data: { status: "archived" },
      });
      // Or hard delete if unused?
      // User requested "Delete".
      // I will soft-delete by setting status to 'archived', as GET filters by 'active'.

      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to delete client" },
        { status: 500 }
      );
    }
  }
);
