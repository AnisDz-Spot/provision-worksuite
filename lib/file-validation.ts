// lib/file-validation.ts - Server-side file upload validation
import { NextRequest } from "next/server";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
];

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validate uploaded file for avatars
 */
export async function validateAvatarFile(
  request: NextRequest
): Promise<FileValidationResult> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    // Check file size
    if (file.size > MAX_AVATAR_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${MAX_AVATAR_SIZE / (1024 * 1024)}MB limit`,
      };
    }

    // Check file type
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_AVATAR_TYPES.join(", ")}`,
      };
    }

    // Additional security: Check file extension matches MIME type
    const extension = file.name.split(".").pop()?.toLowerCase();
    const expectedExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!extension || !expectedExtensions.includes(extension)) {
      return {
        valid: false,
        error: "File extension does not match MIME type",
      };
    }

    return { valid: true, file };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to process file upload",
    };
  }
}

/**
 * Validate uploaded file for documents
 */
export async function validateDocumentFile(
  request: NextRequest
): Promise<FileValidationResult> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    // Check file size
    if (file.size > MAX_DOCUMENT_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB limit`,
      };
    }

    // Check file type
    const allAllowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (!allAllowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed types: images and documents`,
      };
    }

    return { valid: true, file };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to process file upload",
    };
  }
}

/**
 * Validate general file upload
 */
export async function validateFileUpload(
  request: NextRequest,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}
): Promise<FileValidationResult> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    const maxSize = options.maxSize || MAX_FILE_SIZE;
    const allowedTypes = options.allowedTypes || [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ];

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
      };
    }

    // Check file size is not 0
    if (file.size === 0) {
      return {
        valid: false,
        error: "File is empty",
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}`,
      };
    }

    // Security: Prevent directory traversal in filename
    if (
      file.name.includes("..") ||
      file.name.includes("/") ||
      file.name.includes("\\")
    ) {
      return {
        valid: false,
        error: "Invalid filename",
      };
    }

    return { valid: true, file };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to process file upload",
    };
  }
}

/**
 * Sanitize filename to prevent security issues
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special chars
    .replace(/\.+/g, ".") // Replace multiple dots
    .replace(/^\.+/, "") // Remove leading dots
    .substring(0, 255); // Limit length
}
