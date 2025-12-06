import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File must be less than 10MB",
        },
        { status: 400 }
      );
    }

    // Upload using unified provider
    // path 'test-uploads' will result in 'test-uploads/filename'
    const url = await uploadFile(file, "test-uploads");

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully!",
      url: url,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      provider: process.env.STORAGE_PROVIDER || "vercel-blob",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Check your storage configuration",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Storage test endpoint. Use POST to upload a file.",
    provider: process.env.STORAGE_PROVIDER || "vercel-blob",
    usage: 'Send a multipart/form-data request with a "file" field',
  });
}
