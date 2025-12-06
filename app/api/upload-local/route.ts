import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  // Only allow in development or self-hosting mode
  if (
    process.env.STORAGE_PROVIDER !== "local" &&
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

    const buffer = Buffer.from(await file.arrayBuffer());

    // Ensure uploads directory exists
    // We'll store files in a folder named 'uploads' in the project root
    const uploadDir = path.join(process.cwd(), "uploads");
    const fullPath = path.join(uploadDir, filePath);
    const dir = path.dirname(fullPath);

    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, buffer);

    // Return the URL to access the file
    // This assumes we have a route handler for /api/uploads
    const url = `/api/uploads/${filePath}`;

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
