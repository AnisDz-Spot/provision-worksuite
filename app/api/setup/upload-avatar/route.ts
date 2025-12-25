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
    const { validateFile, processImage } = await import("@/lib/security-utils");
    let buffer = Buffer.from((await file.arrayBuffer()) as any);

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

    // 3. Re-encode to strip metadata and normalize
    let finalMime = validation.mimeType || file.type;
    if (finalMime !== "image/gif") {
      try {
        buffer = await processImage(buffer);
        finalMime = "image/webp";
      } catch (e) {
        console.error("Avatar processing failed:", e);
        return NextResponse.json(
          { error: "Failed to process image safely." },
          { status: 422 }
        );
      }
    }

    // 4. Upload to Vercel Blob
    const finalFilename =
      file.name.replace(/\.[^/.]+$/, "") +
      (finalMime === "image/webp" ? ".webp" : "");
    const blob = await put(finalFilename, buffer, {
      access: "public",
      contentType: finalMime,
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
