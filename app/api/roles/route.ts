import { NextResponse } from "next/server";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { getAllRoles, upsertRole } from "@/lib/db/roles";
import { sql } from "@vercel/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    // Always return roles ordered by order, name
    const roles = await getAllRoles();
    const ordered = Array.isArray(roles)
      ? [...roles].sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0))
            return (a.order ?? 0) - (b.order ?? 0);
          return a.name.localeCompare(b.name);
        })
      : roles;
    return NextResponse.json({ success: true, data: ordered });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to load roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    await sql`
      INSERT INTO roles (id, name, description, color_hex, "order")
      VALUES (${body.id}, ${body.name}, ${body.description || null}, ${body.color_hex || body.colorHex || null}, ${body.order ?? 0})
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        color_hex = EXCLUDED.color_hex,
        "order" = EXCLUDED."order",
        updated_at = NOW()
    `;
    // Return the full ordered list for UI refresh
    const roles = await getAllRoles();
    const ordered = Array.isArray(roles)
      ? [...roles].sort((a, b) => {
          if ((a.order ?? 0) !== (b.order ?? 0))
            return (a.order ?? 0) - (b.order ?? 0);
          return a.name.localeCompare(b.name);
        })
      : roles;
    return NextResponse.json({ success: true, data: ordered });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to save role" },
      { status: 500 }
    );
  }
}

// Batch upsert to reduce API calls
export async function PUT(request: Request) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Expected an array of roles" },
        { status: 400 }
      );
    }
    // Validate required fields and duplicates
    const ids = new Set<string>();
    for (const r of body) {
      if (!r || typeof r !== "object") {
        return NextResponse.json(
          { success: false, error: "Invalid role object in payload" },
          { status: 400 }
        );
      }
      const id = r.id;
      const name = r.name;
      if (!id || typeof id !== "string" || !name || typeof name !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Each role must include string 'id' and 'name'",
          },
          { status: 400 }
        );
      }
      if (ids.has(id)) {
        return NextResponse.json(
          { success: false, error: `Duplicate id detected: ${id}` },
          { status: 400 }
        );
      }
      ids.add(id);
    }

    for (const r of body) {
      const normalized = {
        id: r.id,
        name: r.name,
        description: r.description || null,
        color_hex: r.color_hex || r.colorHex || null,
        order: r.order ?? 0,
      } as any;
      await sql`
        INSERT INTO roles (id, name, description, color_hex, "order")
        VALUES (${normalized.id}, ${normalized.name}, ${normalized.description}, ${normalized.color_hex}, ${normalized.order})
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          color_hex = EXCLUDED.color_hex,
          "order" = EXCLUDED."order",
          updated_at = NOW()
      `;
    }

    // Return authoritative ordered list
    const ordered = await getAllRoles();
    return NextResponse.json({ success: true, data: ordered });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to batch save roles" },
      { status: 500 }
    );
  }
}
