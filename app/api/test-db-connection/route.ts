export async function GET() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    return new Response(
      JSON.stringify({ success: false, error: "No database URL configured." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Use native Postgres driver for connection test
    const { Client } = await import("pg");
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await client.end();
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
  }
}
