import { LocalStorageProvider } from "./local";
import { VercelBlobProvider } from "./vercel-provider";
import { S3StorageProvider } from "./s3-provider";
import { StorageProvider, UploadProgress } from "./types";

// Factory to get the active provider
const getProvider = (): StorageProvider => {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;

  if (provider === "local") {
    return new LocalStorageProvider();
  }
  if (provider === "s3") {
    return new S3StorageProvider();
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
  // Ensure we consistently use forward slashes and no leading slash
  const cleanPath = path.replace(/^\/+/, "");
  // Should we append filename? Yes if path acts as "directory"
  // But caller might pass full path.
  // existing abstraction usage: `uploadFile(file, "avatars/userId")` -> expects result to be in that folder.

  // Let's standardise: Caller passes DIRECTORY. We append filename.
  // OR Caller converts to proper logic.
  // lib/storage/index.ts previous logic: const fullPath = `${path}/${file.name}`;
  // Let's keep that.

  const fileName = file.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const fullPath = `${cleanPath}/${fileName}`;
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
