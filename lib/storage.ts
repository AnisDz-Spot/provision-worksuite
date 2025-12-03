/**
 * Firebase Storage Utilities
 *
 * Handle file uploads for avatars, project documents, and attachments
 */

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from "firebase/storage";
import { storage } from "./firebase";

// ============================================================================
// FILE UPLOAD
// ============================================================================

export type UploadProgress = {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
};

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (e.g., 'avatars/user123.jpg')
 * @param onProgress - Optional progress callback
 * @returns Download URL of uploaded file
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const storageRef = ref(storage, path);

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  } else {
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
}

/**
 * Upload avatar image
 * @param file - Image file
 * @param userId - User ID
 * @returns Download URL
 */
export async function uploadAvatar(
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `avatars/${userId}.${ext}`;
  return uploadFile(file, path, onProgress);
}

/**
 * Upload project document
 * @param file - Document file
 * @param projectId - Project ID
 * @returns Download URL and metadata
 */
export async function uploadProjectDocument(
  file: File,
  projectId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; name: string; size: number; type: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `projects/${projectId}/${timestamp}_${safeName}`;

  const url = await uploadFile(file, path, onProgress);

  return {
    url,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

/**
 * Upload task attachment
 * @param file - Attachment file
 * @param taskId - Task ID
 * @returns Download URL and metadata
 */
export async function uploadTaskAttachment(
  file: File,
  taskId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; name: string; size: number; type: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `tasks/${taskId}/${timestamp}_${safeName}`;

  const url = await uploadFile(file, path, onProgress);

  return {
    url,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

// ============================================================================
// FILE DELETION
// ============================================================================

/**
 * Delete a file from storage
 * @param path - Full storage path or download URL
 */
export async function deleteFile(path: string): Promise<void> {
  // If it's a URL, extract the path
  if (path.startsWith("http")) {
    const url = new URL(path);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    if (pathMatch) {
      path = decodeURIComponent(pathMatch[1]);
    }
  }

  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}

/**
 * Delete all files in a folder
 * @param folderPath - Folder path (e.g., 'projects/proj123')
 */
export async function deleteFolder(folderPath: string): Promise<void> {
  const folderRef = ref(storage, folderPath);
  const list = await listAll(folderRef);

  const deletePromises = list.items.map((item) => deleteObject(item));
  await Promise.all(deletePromises);
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Get download URL for a file
 * @param path - Storage path
 * @returns Download URL
 */
export async function getFileUrl(path: string): Promise<string> {
  const fileRef = ref(storage, path);
  return getDownloadURL(fileRef);
}

/**
 * List all files in a folder
 * @param folderPath - Folder path
 * @returns Array of file paths and URLs
 */
export async function listFiles(
  folderPath: string
): Promise<Array<{ path: string; url: string }>> {
  const folderRef = ref(storage, folderPath);
  const list = await listAll(folderRef);

  const files = await Promise.all(
    list.items.map(async (item) => ({
      path: item.fullPath,
      url: await getDownloadURL(item),
    }))
  );

  return files;
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @param options - Validation options
 */
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes (default 10MB)
    allowedTypes?: string[]; // MIME types
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`,
    };
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
