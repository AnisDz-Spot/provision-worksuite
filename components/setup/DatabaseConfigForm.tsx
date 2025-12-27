"use client";
import { useState } from "react";

type DatabaseType = "postgresql" | "mysql" | "sqlite";
type StorageProvider = "local" | "s3" | "vercel";

interface DatabaseConfigFormProps {
  onSave: (
    dbUrl: string,
    dbType: DatabaseType,
    storageConfig?: {
      provider: StorageProvider;
      s3Bucket?: string;
      s3Region?: string;
      s3AccessKey?: string;
      s3SecretKey?: string;
      s3Endpoint?: string;
      blobToken?: string;
    }
  ) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
  error?: string | null;
}

export function DatabaseConfigForm({
  onSave,
  onCancel,
  isSaving = false,
  error = null,
}: DatabaseConfigFormProps) {
  const [dbType, setDbType] = useState<DatabaseType>("postgresql");
  const [dbUrl, setDbUrl] = useState("");
  const [storageProvider, setStorageProvider] =
    useState<StorageProvider>("local");

  // S3 Configuration
  const [s3Bucket, setS3Bucket] = useState("");
  const [s3Region, setS3Region] = useState("us-east-1");
  const [s3AccessKey, setS3AccessKey] = useState("");
  const [s3SecretKey, setS3SecretKey] = useState("");
  const [s3Endpoint, setS3Endpoint] = useState("");

  // Vercel Blob Configuration
  const [blobToken, setBlobToken] = useState("");

  const placeholders: Record<DatabaseType, string> = {
    postgresql: "postgresql://user:password@host:port/dbname",
    mysql: "mysql://user:password@host:port/dbname",
    sqlite: "file:./prisma/dev.db",
  };

  const handleSubmit = async () => {
    if (!dbUrl) return;

    const storageConfig = {
      provider: storageProvider,
      ...(storageProvider === "s3" && {
        s3Bucket,
        s3Region,
        s3AccessKey,
        s3SecretKey,
        s3Endpoint: s3Endpoint || undefined,
      }),
      ...(storageProvider === "vercel" && {
        blobToken,
      }),
    };

    await onSave(dbUrl, dbType, storageConfig);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Database Type
        </label>
        <select
          value={dbType}
          onChange={(e) => setDbType(e.target.value as DatabaseType)}
          className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          disabled={isSaving}
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Select your preferred database system
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Connection String
        </label>
        <input
          type="text"
          placeholder={placeholders[dbType]}
          value={dbUrl}
          onChange={(e) => setDbUrl(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-mono text-sm"
          disabled={isSaving}
        />
        <p className="text-xs text-slate-500 mt-2">
          This will be written to a local <code>.env</code> file. Ensure your
          server environment supports persistent files.
        </p>
      </div>

      {/* Storage Provider Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          File Storage Configuration
        </h3>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Storage Provider
          </label>
          <select
            value={storageProvider}
            onChange={(e) =>
              setStorageProvider(e.target.value as StorageProvider)
            }
            className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            disabled={isSaving}
          >
            <option value="local">Local Storage (Default)</option>
            <option value="s3">AWS S3 / Compatible</option>
            <option value="vercel">Vercel Blob</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {storageProvider === "local" &&
              "Files stored in local file system (no credentials needed)"}
            {storageProvider === "s3" &&
              "Works with AWS S3, MinIO, DigitalOcean Spaces, Cloudflare R2"}
            {storageProvider === "vercel" &&
              "Requires Vercel Blob storage token"}
          </p>
        </div>

        {/* S3 Credentials */}
        {storageProvider === "s3" && (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bucket Name *
              </label>
              <input
                type="text"
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
                placeholder="my-bucket"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md"
                disabled={isSaving}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  AWS Region
                </label>
                <input
                  type="text"
                  value={s3Region}
                  onChange={(e) => setS3Region(e.target.value)}
                  placeholder="us-east-1"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Custom Endpoint (optional)
                </label>
                <input
                  type="text"
                  value={s3Endpoint}
                  onChange={(e) => setS3Endpoint(e.target.value)}
                  placeholder="https://s3.example.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Access Key ID *
              </label>
              <input
                type="text"
                value={s3AccessKey}
                onChange={(e) => setS3AccessKey(e.target.value)}
                placeholder="AKIA..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md font-mono"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Secret Access Key *
              </label>
              <input
                type="password"
                value={s3SecretKey}
                onChange={(e) => setS3SecretKey(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md font-mono"
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        {/* Vercel Blob Token */}
        {storageProvider === "vercel" && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vercel Blob Token *
              </label>
              <input
                type="password"
                value={blobToken}
                onChange={(e) => setBlobToken(e.target.value)}
                placeholder="vercel_blob_rw_..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md font-mono"
                disabled={isSaving}
              />
              <p className="text-xs text-slate-500 mt-1">
                Get this from Vercel Dashboard → Storage → Blob → Create Token
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSaving || !dbUrl}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? "Saving..." : "Save & Connect"}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
