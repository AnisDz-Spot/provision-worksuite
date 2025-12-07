import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  // Only allow in development or self-hosting mode
  if (
    process.env.NEXT_PUBLIC_STORAGE_PROVIDER !== "local" &&
    process.env.NODE_ENV === "production"
  ) {
    return NextResponse.json(
      { error: "Local upload not enabled" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filePath = formData.get("path") as string;

    if (!file || !filePath) {
      return NextResponse.json(
        { error: "Missing file or path" },
        { status: 400 }
      );
    }

    // SECURITY: Sanitize and validate file path to prevent directory traversal
    const safePath = filePath
      .replace(/\.\./g, "")
      .replace(/^\//, "")
      .replace(/\\/g, "/");

    // Validate: only alphanumeric, dash, underscore, slash, dot
    if (!/^[a-zA-Z0-9\-_\/\.]+$/.test(safePath)) {
      return NextResponse.json(
        { error: "Invalid file path characters" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadDir, safePath);

    // SECURITY: Ensure normalized path is still within uploads directory
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(uploadDir)) {
      return NextResponse.json(
        { error: "Invalid path: directory traversal detected" },
        { status: 403 }
      );
    }

    const dir = path.dirname(fullPath);

    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, buffer);

    // Return the URL to access the file
    // This assumes we have a route handler for /api/uploads
    const url = `/api/uploads/${safePath}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Local upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Implementation for delete
  return NextResponse.json({ success: true });
}
