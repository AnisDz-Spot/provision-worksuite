import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
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
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // Map form data to schema
    // Logic: If 'companyName' is provided, use that as the Client Name, and 'name' as Primary Contact.
    // If not, use 'name' as Client Name (Individual).

    let clientName = body.name;
    let primaryContact = body.companyName ? body.name : undefined;
    let type = "individual";

    if (body.companyName) {
      clientName = body.companyName;
      type = "company";
    }

    // Fallback: If user put Company Name in 'name' field and left companyName empty (common),
    // we assume it's a company if no companyName is strictly separate.
    // But adhering to the form logic in page.tsx:
    // Label "Name *" (John Doe), "Company Name" (Acme Inc.)
    // If I enter "Anis" and "Provison", Client should probably be "Provision" (Company) and Contact "Anis".
    // If I enter "Anis" and "", Client is "Anis" (Individual).

    // However, if the user fills "Name" with "Heaven Promotion" (as seen in screenshot) and empty "Company Name",
    // then `clientName` = "Heaven Promotion". Type defaults to individual?
    // User might want to adjust type manually later or we infer?
    // For now, let's Stick to the simple mapping:
    // If companyName is present, it TAKES PRECEDENCE as the Client Entity Name.

    const client = await prisma.client.create({
      data: {
        name: clientName,
        primaryContact: primaryContact,
        primaryEmail: body.email,
        phone: body.phone,
        website: body.website,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        // postalCode in schema is `postalCode`? Let's check schema.
        postalCode: body.postalCode,
        notes: body.notes,
        type: type,
        status: "active",
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
