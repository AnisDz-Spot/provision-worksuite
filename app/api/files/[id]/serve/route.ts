import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

/**
 * Secure File Serving API
 *
 * Serves files stored in the database (as base64/data URLs) with strict security headers.
 * This ensures that img-src 'self' can be enforced while blocking external URLs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    // 1. Identify content and mime type
    const mimeType = file.mimeType || "application/octet-stream";
    let buffer: Buffer;

    if (file.fileUrl.startsWith("data:")) {
      // Extract base64 part
      const base64Data = file.fileUrl.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      // If it's a URL (e.g. from Vercel Blob or older records),
      // we proxy it to keep everything under 'self'
      const response = await fetch(file.fileUrl);
      if (!response.ok) {
        return new NextResponse("Error fetching original file", {
          status: 502,
        });
      }
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // 2. Serve with strict security headers
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "X-Content-Type-Options": "nosniff", // Prevent mime-sniffing
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour per user
        "Content-Security-Policy": "default-src 'none'; sandbox", // Sandbox if viewed directly
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
