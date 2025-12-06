import { LocalStorageProvider } from "./local";
import { VercelBlobProvider } from "./vercel-provider";
import { StorageProvider, UploadProgress } from "./types";

// Factory to get the active provider
// Default to Vercel Blob if not specified, or Local if specified
const getProvider = (): StorageProvider => {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
  // Note: We use NEXT_PUBLIC_ because this might be called on client side (though abstract methods usually call API)
  // Actually, Vercel Blob `put` works on client side? Yes, if token is present.
  // My LocalStorageProvider works on client side via API.

  if (provider === "local") {
    return new LocalStorageProvider();
  }
  return new VercelBlobProvider();
};

const provider = getProvider();

// ============================================================================
// CORE OPERATIONS
// ============================================================================

export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Ensure path has filename if not provided?
  // Usually path is folder + filename.
  // My previous code: `put(${path}/${file.name})`
  // Let's standardise: path argument should be the FULL path including filename?
  // Or folder?
  // In vercel-blob.ts: `put(${path}/${file.name}` so input 'path' was a folder.
  // In LocalStorageProvider: `formData.append("path", path)` -> route uses `uploads/path`.
  // If I pass "avatars/user1" to uploadFile, I want it to be "avatars/user1/filename.jpg" or just "avatars/user1.jpg"?

  // Existing usage: `uploadFile(file, "avatars/userId", ...)` (from vercel-blob.ts)
  // and `put` uses `${path}/${file.name}`.
  // So 'path' meant 'directory'.

  // let's follow that convention
  const fullPath = `${path}/${file.name}`;
  return provider.uploadFile(file, fullPath, onProgress);
}

export async function deleteFile(url: string): Promise<void> {
  return provider.deleteFile(url);
}

export async function listFiles(path: string) {
  return provider.listFiles(path);
}

// ============================================================================
// HIGH-LEVEL HELPERS
// ============================================================================

export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
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
