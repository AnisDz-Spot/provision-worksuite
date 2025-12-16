import { NextResponse } from "next/server";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { getAllBlockers, createBlocker } from "@/lib/db/blockers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!shouldUseDatabaseData()) {
    // In demo mode, return empty data instead of error
    return NextResponse.json({
      success: true,
      data: [],
      source: "demo",
    });
  }
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId") || undefined;
    const blockers = await getAllBlockers(projectId);
    return NextResponse.json({ success: true, data: blockers });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to load blockers" },
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
    const blocker = await createBlocker(body);
    return NextResponse.json({ success: true, data: blocker });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to create blocker" },
      { status: 500 }
    );
  }
}
