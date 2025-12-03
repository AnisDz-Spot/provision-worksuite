import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        error: 'File must be less than 10MB' 
      }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(`test-uploads/${file.name}`, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'File uploaded successfully!',
      url: blob.url,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Make sure Blob storage is set up and BLOB_READ_WRITE_TOKEN is configured'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Blob storage test endpoint. Use POST to upload a file.',
    usage: 'Send a multipart/form-data request with a "file" field'
  });
}
