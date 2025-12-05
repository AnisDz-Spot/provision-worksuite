import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "No database URL configured." },
      { status: 400 }
    );
  }

  try {
    // Test connection by attempting to connect and disconnect
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to connect to database.",
      },
      { status: 500 }
    );
  }
}
