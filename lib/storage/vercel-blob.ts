import { put, del, list } from "@vercel/blob";

export type UploadProgress = {
  loaded: number;
  total: number;
  progress: number;
};

// ============================================================================
// FILE UPLOADS
// ============================================================================

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Simulate progress if callback provided
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, progress: 0 });
    }

    const blob = await put(`${path}/${file.name}`, file, {
      access: "public",
    });

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, progress: 100 });
    }

    return blob.url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw new Error("Failed to upload file");
  }
}

export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Validate file
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be less than 5MB");
  }

  return uploadFile(file, `avatars/${userId}`, onProgress);
}

export async function uploadProjectDocument(
  file: File,
  projectId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Validate file size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File must be less than 10MB");
  }

  return uploadFile(file, `projects/${projectId}`, onProgress);
}

export async function uploadTaskAttachment(
  file: File,
  taskId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File must be less than 10MB");
  }

  return uploadFile(file, `tasks/${taskId}`, onProgress);
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

export async function deleteFile(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error("Delete failed:", error);
    throw new Error("Failed to delete file");
  }
}

export async function listFiles(path: string) {
  try {
    const { blobs } = await list({ prefix: path });
    return blobs;
  } catch (error) {
    console.error("List files failed:", error);
    throw new Error("Failed to list files");
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

export function validateFile(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
  }
): boolean {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${formatFileSize(maxSize)}`);
  }

  if (
    allowedTypes &&
    !allowedTypes.some((type) => file.type.startsWith(type))
  ) {
    throw new Error(`File type must be one of: ${allowedTypes.join(", ")}`);
  }

  return true;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
