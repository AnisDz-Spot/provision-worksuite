import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";


export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const { uid } = await context.params;
  if (!uid) {
    return NextResponse.json(
      { success: false, error: "Missing user id" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, avatar_url } = body || {};

    const updates: string[] = [];
    const values: any[] = [];

    if (typeof name === "string" && name.trim()) {
      updates.push("name = $" + (values.length + 1));
      values.push(name.trim());
    }
    if (typeof email === "string" && email.trim()) {
      updates.push("email = $" + (values.length + 1));
      values.push(email.trim());
    }
    if (typeof avatar_url === "string") {
      updates.push("avatar_url = $" + (values.length + 1));
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Build parameterized query
    const setClause = updates.join(", ");
    const query = `UPDATE users SET ${setClause} WHERE uid = $${values.length + 1} RETURNING uid, email, name, avatar_url, role, created_at`;
    const result = await sql.query(query, [...values, uid]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
