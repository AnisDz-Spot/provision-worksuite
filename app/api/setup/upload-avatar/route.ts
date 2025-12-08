import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Upload to Vercel Blob
  // access: 'public' is required for avatars to be viewable
  const blob = await put(filename || file.name, file, {
    access: "public",
  });

  return NextResponse.json({ success: true, url: blob.url });
}
