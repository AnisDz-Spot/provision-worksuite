import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { StorageProvider, UploadProgress } from "./types";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private publicUrl?: string;

  constructor() {
    this.region = process.env.S3_REGION || "us-east-1";
    this.bucket = process.env.S3_BUCKET_NAME || "";
    this.publicUrl = process.env.S3_PUBLIC_URL; // Optional custom domain/CDN

    if (!this.bucket) {
      console.warn("S3_BUCKET_NAME not set. S3 provider will fail.");
    }

    this.client = new S3Client({
      region: this.region,
      endpoint: process.env.S3_ENDPOINT, // Support for MinIO, Spaces, R2
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", // Needed for MinIO usually
    });
  }

  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const parallelUploads3 = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: path,
        Body: file,
        ContentType: file.type,
      },
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
      if (
        onProgress &&
        progress.loaded !== undefined &&
        progress.total !== undefined
      ) {
        onProgress({
          loaded: progress.loaded,
          total: progress.total,
          progress: Math.round((progress.loaded / progress.total) * 100),
        });
      }
    });

    await parallelUploads3.done();

    // Construct public URL
    if (this.publicUrl) {
      return `${this.publicUrl}/${path}`;
    }

    // Default URL construction (basic S3 style)
    // If endpoint is set (e.g. MinIO), usage depends on forcePathStyle.
    // Simplifying assumption for now or standard AWS URL.
    if (process.env.S3_ENDPOINT) {
      // Typically endpoint/bucket/key or bucket.endpoint/key
      // For MinIO with forcePathStyle=true: endpoint/bucket/key
      const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, "");
      return `${endpoint}/${this.bucket}/${path}`;
    }

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
  }

  async deleteFile(url: string): Promise<void> {
    // Extract key from URL
    // Assumption: URL ends with the key.
    // This is fragile if not standardized, but for this app we control creation.
    // Let's rely on the fact that we know the structure.

    let key = url;
    if (this.publicUrl && url.startsWith(this.publicUrl)) {
      key = url.replace(`${this.publicUrl}/`, "");
    } else if (url.includes("amazonaws.com")) {
      // ...amazonaws.com/key
      const parts = url.split(".amazonaws.com/");
      if (parts.length > 1) key = parts[1];
    } else if (
      process.env.S3_ENDPOINT &&
      url.startsWith(process.env.S3_ENDPOINT)
    ) {
      // endpoint/bucket/key
      key = url.replace(`${process.env.S3_ENDPOINT}/${this.bucket}/`, "");
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async listFiles(path: string): Promise<{ url: string; pathname: string }[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: path,
    });

    const response = await this.client.send(command);

    return (response.Contents || []).map((item) => {
      const key = item.Key || "";
      let url = "";
      if (this.publicUrl) {
        url = `${this.publicUrl}/${key}`;
      } else if (process.env.S3_ENDPOINT) {
        const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, "");
        url = `${endpoint}/${this.bucket}/${key}`;
      } else {
        url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
      }

      return {
        url,
        pathname: key,
      };
    });
  }
}
