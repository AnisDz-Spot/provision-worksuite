import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Prevent DB access if not configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const targetUser = searchParams.get("user");
  if (!targetUser) {
    return NextResponse.json(
      { success: false, error: "Missing user" },
      { status: 400 }
    );
  }

  // Enforce that the requester is the user whose conversations are being requested
  if (user.uid !== targetUser) {
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden: You can only view your own conversations",
      },
      { status: 403 }
    );
  }

  try {
    // Aggregate conversations: last message and unread count per other user
    const result = await sql`
      WITH conv AS (
        SELECT 
          CASE WHEN from_user = ${targetUser} THEN to_user ELSE from_user END AS other_user,
          message,
          created_at,
          (CASE WHEN to_user = ${targetUser} AND is_read = false THEN 1 ELSE 0 END) AS unread_unit
        FROM messages
        WHERE from_user = ${targetUser} OR to_user = ${targetUser}
      )
      SELECT other_user,
             SUM(unread_unit)::int AS unread_count,
             (ARRAY_AGG(ROW(message, created_at) ORDER BY created_at DESC))[1] AS last_row
      FROM conv
      GROUP BY other_user
      ORDER BY ((ARRAY_AGG(ROW(message, created_at) ORDER BY created_at DESC))[1]).f2 DESC
    `;

    const data = result.rows.map((row: any) => ({
      withUser: row.other_user,
      unreadCount: row.unread_count || 0,
      lastMessage: row.last_row?.f1 || "",
      lastTimestamp: row.last_row?.f2 || new Date().toISOString(),
      isOnline: false,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: [],
        details: error,
      },
      { status: 500 }
    );
  }
}
