import { NextResponse } from "next/server";

// NOTE: Prisma CLI commands (db push, generate) cannot be run in Vercel/serverless environments.
// Please run `npx prisma db push` and `npx prisma generate` locally or in your CI/CD pipeline before deploying.
// This endpoint only validates that the API is reachable and the DB URL is set.

export async function POST() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "No database URL configured." },
      { status: 400 }
    );
  }

  // You may add a simple DB query here to validate connection if needed.

  return NextResponse.json({
    success: false,
    error:
      "Prisma CLI commands (db push, generate) cannot be run in Vercel/serverless environments. Please run them locally or in CI/CD before deploy."
  });
}
}
