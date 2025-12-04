import { NextResponse } from "next/server";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { upsertRole, deleteRole } from "@/lib/db/roles";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const saved = await upsertRole({ ...body, id: params.id });
    return NextResponse.json({ success: true, data: saved });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to update role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!shouldUseDatabaseData()) {
    return NextResponse.json(
      { success: false, error: "Database mode disabled" },
      { status: 400 }
    );
  }
  try {
    await deleteRole(params.id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || "Failed to delete role" },
      { status: 500 }
    );
  }
}
