import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    log.info({ count: roles.length }, "Fetched roles");

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    log.error({ err: error }, "Get roles error");
    return NextResponse.json(
      { success: false, error: "Failed to load roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, color_hex, colorHex, order } = body;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "ID and name are required" },
        { status: 400 }
      );
    }

    const role = await prisma.role.upsert({
      where: { id },
      update: {
        name,
        description: description || null,
        colorHex: color_hex || colorHex || null,
        order: order ?? 0,
      },
      create: {
        id,
        name,
        description: description || null,
        colorHex: color_hex || colorHex || null,
        order: order ?? 0,
      },
    });

    // Return all roles sorted
    const roles = await prisma.role.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    log.info({ roleId: id, action: "upsert" }, "Role upserted");

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    log.error({ err: error }, "Save role error");
    return NextResponse.json(
      { success: false, error: "Failed to save role" },
      { status: 500 }
    );
  }
}

// Batch upsert to reduce API calls
export async function PUT(request: Request) {
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

    // Upsert each role
    for (const r of body) {
      await prisma.role.upsert({
        where: { id: r.id },
        update: {
          name: r.name,
          description: r.description || null,
          colorHex: r.color_hex || r.colorHex || null,
          order: r.order ?? 0,
        },
        create: {
          id: r.id,
          name: r.name,
          description: r.description || null,
          colorHex: r.color_hex || r.colorHex || null,
          order: r.order ?? 0,
        },
      });
    }

    // Return authoritative ordered list
    const roles = await prisma.role.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    log.info({ count: body.length }, "Batch roles upserted");

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    log.error({ err: error }, "Batch save roles error");
    return NextResponse.json(
      { success: false, error: "Failed to batch save roles" },
      { status: 500 }
    );
  }
}
