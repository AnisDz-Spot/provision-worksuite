import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { shouldReturnMockData } from "@/lib/mock-helper";
import { MOCK_CLIENTS } from "@/lib/mock-data";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // In demo mode or for global admin, return mock clients
  if (!shouldUseDatabaseData() || shouldReturnMockData(user)) {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let filteredClients = MOCK_CLIENTS;
    if (search) {
      const q = search.toLowerCase();
      filteredClients = MOCK_CLIENTS.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.primaryEmail?.toLowerCase().includes(q) ||
          c.primaryContact?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredClients,
      source: "mock",
    });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  try {
    const whereClause: any = {
      status: "active",
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { primaryEmail: { contains: search, mode: "insensitive" } },
        { primaryContact: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  // Role check: Only Master Admin, Admin, and Project Manager can add clients
  const { isAdmin, isProjectManager } = await import("@/lib/auth-utils");
  if (!isAdmin(user) && !isProjectManager(user)) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden: You do not have permission to add clients",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Map form data to schema
    // Logic: If 'companyName' is provided, use that as the Client Name, and 'name' as Primary Contact.
    // If not, use 'name' as Client Name (Individual).

    // Simplified mapping: Use what the form sends
    const client = await prisma.client.create({
      data: {
        name: body.name,
        primaryContact: body.primaryContact, // Explicitly use provided contact
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
        type: body.type || "company", // respect type from form
        status: body.status || "active",
        logo: body.logo, // Validated on frontend or uploaded URL
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("Failed to create client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create client" },
      { status: 500 }
    );
  }
}
