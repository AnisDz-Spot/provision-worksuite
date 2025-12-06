import { StorageProvider, UploadProgress } from "./types";
import { put, del, list } from "@vercel/blob";

export class VercelBlobProvider implements StorageProvider {
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Vercel Blob doesn't support progress updates natively in the simple put()
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, progress: 0 });
    }

    const blob = await put(path, file, {
      access: "public",
    });

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, progress: 100 });
    }

    return blob.url;
  }

  async deleteFile(url: string): Promise<void> {
    await del(url);
  }

  async listFiles(path: string): Promise<{ url: string; pathname: string }[]> {
    const { blobs } = await list({ prefix: path });
    return blobs.map((b) => ({ url: b.url, pathname: b.pathname }));
  }
}
