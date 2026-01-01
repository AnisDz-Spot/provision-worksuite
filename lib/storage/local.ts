import { getCsrfToken, fetchWithCsrf } from "../csrf-client";
import { StorageProvider, UploadProgress } from "./types";

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(
    file: File,
    filePath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Check if running on server-side
    if (typeof window === "undefined") {
      try {
        const { writeFile, mkdir } = await import("fs/promises");
        const path = await import("path");

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "uploads");
        const fullPath = path.join(uploadDir, filePath);
        const dir = path.dirname(fullPath);

        await mkdir(dir, { recursive: true });
        await writeFile(fullPath, buffer);

        // Return the API URL to access the file
        return `/api/uploads/${filePath.replace(/\\/g, "/")}`;
      } catch (error) {
        console.error(
          "[LocalStorageProvider] Server-side upload failed:",
          error
        );
        throw new Error("Upload failed (server-side)");
      }
    }

    // Client-side implementation (using the upload-local API)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", filePath);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload-local");
      xhr.setRequestHeader("x-csrf-token", getCsrfToken() || "");

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              progress: (event.loaded / event.total) * 100,
            });
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url);
        } else {
          reject(new Error("Upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
  }

  async deleteFile(url: string): Promise<void> {
    if (typeof window === "undefined") {
      try {
        const { unlink } = await import("fs/promises");
        const path = await import("path");

        // Extract the path from the URL (/api/uploads/...)
        const relativePath = url.replace("/api/uploads/", "");
        const filePath = path.join(process.cwd(), "uploads", relativePath);

        await unlink(filePath);
        return;
      } catch (error) {
        console.error(
          "[LocalStorageProvider] Server-side delete failed:",
          error
        );
        // We don't necessarily want to throw here if the file is already gone
      }
    }

    await fetchWithCsrf("/api/upload-local", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
  }

  async listFiles(path: string): Promise<{ url: string; pathname: string }[]> {
    return [];
  }
}
