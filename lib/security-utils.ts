/**
 * Security Utilities for File Handling
 *
 * This module provides functions to validate files based on magic bytes (file signatures)
 * to prevent mime-type spoofing and other image-based vulnerabilities.
 */

// Supported Magic Bytes (File Signatures)
// Note: We use the first few bytes of the file to identify its true type.
const MAGIC_BYTES = {
  // JPEG: FF D8 FF
  JPEG: [0xff, 0xd8, 0xff],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  // GIF: 47 49 46 38
  GIF: [0x47, 0x49, 0x46, 0x38],
  // WebP: 52 49 46 46 (followed by WEBP at offset 8)
  WEBP: [
    0x52,
    0x49,
    0x46,
    0x46,
    null,
    null,
    null,
    null,
    0x57,
    0x45,
    0x42,
    0x50,
  ],
} as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  mimeType?: string;
}

/**
 * Validates a file buffer against its claimed mime-type using magic bytes.
 */
export async function validateFile(
  buffer: Buffer,
  claimedMime: string,
  maxSizeMB: number = 5
): Promise<ValidationResult> {
  // 1. Check File Size
  const maxSize = maxSizeMB * 1024 * 1024;
  if (buffer.length > maxSize) {
    return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit.` };
  }

  // 2. Normalize and check Mime Type
  const mime = claimedMime.toLowerCase();

  // Disallow SVGs strictly as per security requirements
  if (mime.includes("svg") || buffer.toString("utf8").includes("<svg")) {
    return {
      isValid: false,
      error: "SVG images are strictly prohibited for security reasons.",
    };
  }

  // 3. Match Magic Bytes
  if (mime === "image/jpeg" || mime === "image/jpg") {
    if (!matchBytes(buffer, MAGIC_BYTES.JPEG)) {
      return { isValid: false, error: "Invalid JPEG file content." };
    }
  } else if (mime === "image/png") {
    if (!matchBytes(buffer, MAGIC_BYTES.PNG)) {
      return { isValid: false, error: "Invalid PNG file content." };
    }
  } else if (mime === "image/webp") {
    if (!matchBytes(buffer, MAGIC_BYTES.WEBP)) {
      return { isValid: false, error: "Invalid WebP file content." };
    }
  } else if (mime === "image/gif") {
    if (!matchBytes(buffer, MAGIC_BYTES.GIF)) {
      return { isValid: false, error: "Invalid GIF file content." };
    }
  } else if (mime === "application/pdf") {
    // PDF magic bytes: 25 50 44 46 (%PDF)
    if (!matchBytes(buffer, [0x25, 0x50, 0x44, 0x46])) {
      return { isValid: false, error: "Invalid PDF file content." };
    }
  } else {
    // For other files (csv, txt, docx), we strictly check mime type only or extend signatures
    // For now, only allow explicit non-executable types
    const allowedDocs = [
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
    ];

    if (!allowedDocs.includes(mime)) {
      return {
        isValid: false,
        error: `Unsupported or prohibited file type: ${mime}`,
      };
    }
  }

  return { isValid: true, mimeType: mime };
}

/**
 * Compares buffer start with an array of bytes. null is a wildcard.
 */
function matchBytes(
  buffer: Buffer,
  signature: readonly (number | null)[]
): boolean {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== null && buffer[i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Sanitizes a filename to prevent path traversal and shell injection.
 */
export function sanitizeFilename(name: string): string {
  // Remove spaces and special chars, keep dots and underscores
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/_{2,}/g, "_");
}
