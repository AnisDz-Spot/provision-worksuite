import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const clients = await prisma.client.findMany({
      where: { status: "active" }, // Only active clients
      select: {
        id: true,
        name: true,
        logo: true,
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
