import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { validateFile } from "@/lib/storage";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication
    const currentUser = await getAuthenticatedUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = (formData.get("path") as string) || "uploads";
    // Optional entity ID/type for organization if needed, can be part of path
    // const entityId = formData.get("entityId") as string;
    // const entityType = formData.get("entityType") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Default validation (10MB max, generic types)
    // You can enhance this by passing validation options based on `path` or `type`
    try {
      validateFile(file, { maxSize: 10 * 1024 * 1024 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid file" },
        { status: 400 }
      );
    }

    // Construct a safe path.
    // The `uploadFile` storage utility handles specific provider logic.
    // We append the timestamp or uuid to filename to avoid collisions if managed by provider's `put`
    // But `lib/storage/index.ts` already handles path construction slightly.
    // Let's rely on `uploadFile` to handle the actual upload.
    // We pass the "directory" path. The storage lib appends filename.

    const url = await uploadFile(file, path);

    return NextResponse.json({
      success: true,
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    log.error({ err: error }, "Upload failed");
    return NextResponse.json(
      {
        error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
