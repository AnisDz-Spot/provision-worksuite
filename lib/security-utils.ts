import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";

/**
 * Security Utilities for File Handling
 *
 * This module provides functions to validate files based on magic bytes (file signatures)
 * and re-encode images to strip metadata and neutralize polyglot attacks.
 */

// Supported Magic Bytes (Manual fallbacks for file-type signatures if needed)
const MAGIC_BYTES = {
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  GIF: [0x47, 0x49, 0x46, 0x38],
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
  processedBuffer?: Buffer;
}

/**
 * Validates a file buffer against its claimed mime-type using magic bytes and robust detection.
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

  // 2. Strict MIME detection from buffer
  const detected = await fileTypeFromBuffer(buffer);
  const detectedMime = detected?.mime.toLowerCase();
  const normalizedClaimed = claimedMime.toLowerCase();

  // 3. Prevent SVG polyglots and execution
  if (
    normalizedClaimed.includes("svg") ||
    (detectedMime && detectedMime.includes("svg")) ||
    buffer.toString("utf8").includes("<svg")
  ) {
    return {
      isValid: false,
      error: "SVG images are strictly prohibited for security reasons.",
    };
  }

  // 4. MIME Trust Boundary: Compare detected vs claimed
  // Special case: some browsers send generic application/octet-stream for downloads
  const isGeneric = normalizedClaimed === "application/octet-stream";

  if (!detectedMime) {
    // If we can't detect it as a known binary, allow only safe text-based types
    const allowedText = ["text/plain", "text/csv", "application/json"];
    if (!allowedText.includes(normalizedClaimed)) {
      return {
        isValid: false,
        error: "Unrecognized file content or unsupported format.",
      };
    }
    return { isValid: true, mimeType: normalizedClaimed };
  }

  // If detected, it must match the claimed type (unless claimed is generic)
  if (!isGeneric && detectedMime !== normalizedClaimed) {
    // Allow some common mismatches if they are within the same family (e.g. jpg/jpeg)
    const familyMap: Record<string, string[]> = {
      "image/jpeg": ["image/jpg", "image/jpeg"],
      "image/png": ["image/png"],
      "image/webp": ["image/webp"],
      "application/pdf": ["application/pdf"],
    };

    const family = familyMap[detectedMime];
    if (!family || !family.includes(normalizedClaimed)) {
      return {
        isValid: false,
        error: `MIME type mismatch: detected ${detectedMime} but claimed ${normalizedClaimed}.`,
      };
    }
  }

  // 5. Final Magic Byte Verification (Manual check for critical types)
  if (detectedMime === "image/jpeg" && !matchBytes(buffer, MAGIC_BYTES.JPEG)) {
    return { isValid: false, error: "Corrupt or deceptive JPEG file." };
  }
  if (detectedMime === "image/png" && !matchBytes(buffer, MAGIC_BYTES.PNG)) {
    return { isValid: false, error: "Corrupt or deceptive PNG file." };
  }

  return { isValid: true, mimeType: detectedMime };
}

/**
 * Re-encodes an image to strip metadata (EXIF/ICC) and neutralize payloads.
 * Normalizes to WebP for efficient and safe storage.
 */
export async function processImage(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF (then stripped)
      .resize(2048, 2048, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat("webp", { quality: 80 })
      .toBuffer();
  } catch (e) {
    throw new Error(
      "Failed to process image: " +
        (e instanceof Error ? e.message : "Unknown error")
    );
  }
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
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/_{2,}/g, "_");
}
