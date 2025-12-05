export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return new Response(
      JSON.stringify({ success: false, error: "No database URL configured." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Set the connection string dynamically before requiring PrismaClient
    process.env.DATABASE_URL = dbUrl;
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Failed to connect to database.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Failed to connect to database.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
