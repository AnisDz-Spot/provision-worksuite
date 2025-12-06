import { StorageProvider, UploadProgress } from "./types";

export class LocalStorageProvider implements StorageProvider {
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // For local development/self-hosting, we'll use a special API route to handle the actual file write
    // This is because we can't write to the filesystem directly from the client side
    // and we want to keep the interface consistent

    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload-local");

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
    await fetch("/api/upload-local", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
  }

  async listFiles(path: string): Promise<{ url: string; pathname: string }[]> {
    // Listing not fully supported in simple local implementation yet
    // return empty for now or implement directory listing API
    return [];
  }
}
