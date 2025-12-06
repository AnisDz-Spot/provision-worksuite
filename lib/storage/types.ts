export type UploadProgress = {
  loaded: number;
  total: number;
  progress: number;
};

export interface StorageProvider {
  uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string>;

  deleteFile(url: string): Promise<void>;

  listFiles(path: string): Promise<{ url: string; pathname: string }[]>;
}
