import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { validateFile } from "@/lib/security-utils";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // 1. Optional Auth (Setup usually has limited auth, but we should check if possible)
    const user = await getAuthenticatedUser();
    // During initial setup, user might not be fully authenticated yet in the traditional sense
    // but we can check if there's a session or if we are in setup mode.

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 2. Validate File Content (Magic Bytes)
    const buffer = Buffer.from(await file.arrayBuffer());

    // Avatars MUST be images
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed for avatars" },
        { status: 400 }
      );
    }

    const validation = await validateFile(buffer, file.type, 2); // Max 2MB for avatars

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 415 });
    }

    // 3. Upload to Vercel Blob (keeping as public for now if needed, but we'll proxy serve it soon)
    const blob = await put(file.name, buffer, {
      access: "public",
      contentType: validation.mimeType,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
