import { StorageProvider, UploadProgress } from "./types";
import { put, del, list } from "@vercel/blob";
import { getConfig } from "@/lib/config/auto-setup";

export class VercelBlobProvider implements StorageProvider {
  private async getToken(): Promise<string | undefined> {
    const config = await getConfig();
    return config.blobToken;
  }

  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Vercel Blob doesn't support progress updates natively in the simple put()
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, progress: 0 });
    }

    const token = await this.getToken();

    const blob = await put(path, file, {
      access: "public",
      token, // Explicitly pass token from config
    });

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, progress: 100 });
    }

    return blob.url;
  }

  async deleteFile(url: string): Promise<void> {
    const token = await this.getToken();
    await del(url, { token });
  }

  async listFiles(path: string): Promise<{ url: string; pathname: string }[]> {
    const token = await this.getToken();
    const { blobs } = await list({ prefix: path, token });
    return blobs.map((b) => ({ url: b.url, pathname: b.pathname }));
  }
}
