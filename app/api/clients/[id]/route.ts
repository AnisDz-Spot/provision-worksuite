import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

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
