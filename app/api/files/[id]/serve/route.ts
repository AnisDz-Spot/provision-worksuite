import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { rateLimitAPI } from "@/lib/ratelimit";
import crypto from "crypto";

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

    // 1. Rate Limiting (100 requests per minute per IP/User)
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    const ratelimit = await rateLimitAPI(`file_serve:${user.uid || ip}`);
    if (!ratelimit.success) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }

    const { id } = await params;
    const file = await prisma.file.findUnique({ where: { id } });

    if (!file) {
      return new NextResponse("File not found", { status: 404 });
    }

    // 2. Identify content and mime type
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

    // 3. Etag and Cache Validation
    const etag = crypto.createHash("md5").update(buffer).digest("hex");
    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    // 4. Content-Disposition Logic
    // Inline for images/pdfs, attachment for everything else
    const isViewable = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ].includes(mimeType);
    const disposition = isViewable ? "inline" : "attachment";

    // 5. Serve with strict security headers
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "X-Content-Type-Options": "nosniff", // Prevent mime-sniffing
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        ETag: etag,
        "Content-Disposition": `${disposition}; filename=\"${encodeURIComponent(file.filename)}\"`,
        "Content-Security-Policy": "default-src 'none'; sandbox", // Sandbox if viewed directly
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
