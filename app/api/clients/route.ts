import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { primaryEmail: { contains: search, mode: "insensitive" } },
        { primaryContact: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error("Failed to fetch clients:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only Admin, Master Admin can create clients
    // (Assuming basic role check here, refine as needed)
    // if (user.role !== 'admin' && user.role !== 'master_admin') { ... }

    const body = await request.json();
    const {
      name,
      logo,
      type,
      status,
      // Contact
      primaryEmail,
      secondaryEmail,
      phone,
      website,
      primaryContact,
      // Address
      address,
      city,
      state,
      postalCode,
      country,
      timezone,
      language,
      // Billing
      billingEmail,
      vatNumber,
      currency,
      hourlyRate,
      paymentTerms,
      // Meta
      defaultVisibility,
      tags,
      notes,
      customFields,
    } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name,
        logo,
        type: type || "company",
        status: status || "active",
        primaryEmail,
        secondaryEmail,
        phone,
        website,
        primaryContact,
        address,
        city,
        state,
        postalCode,
        country,
        timezone,
        language,
        billingEmail,
        vatNumber,
        currency,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        paymentTerms,
        defaultVisibility: defaultVisibility || "shared",
        tags: tags || [],
        notes,
        customFields: customFields || {},
      },
    });

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error("Failed to create client:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
