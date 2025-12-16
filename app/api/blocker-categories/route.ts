import { NextResponse } from "next/server";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import {
  getAllBlockerCategories,
  upsertBlockerCategories,
} from "@/lib/db/blockers";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!shouldUseDatabaseData()) {
    // In demo mode, return empty categories
    return NextResponse.json({ success: true, data: [] });
  }
  try {
    const rows = await getAllBlockerCategories();
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to load categories" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const categories = Array.isArray(body) ? body : body?.categories;
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }
    await upsertBlockerCategories(categories);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to save categories" },
      { status: 500 }
    );
  }
}
