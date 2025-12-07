import { NextRequest, NextResponse } from "next/server";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { updateBlocker, deleteBlocker } from "@/lib/db/blockers";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const blocker = await updateBlocker(id, body);
    return NextResponse.json({ success: true, data: blocker });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to update blocker" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    const { id } = await context.params;
    await deleteBlocker(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to delete blocker" },
      { status: 500 }
    );
  }
}
