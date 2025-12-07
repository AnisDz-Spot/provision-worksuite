"use client";
import { useState } from "react";

type DatabaseType = "postgresql" | "mysql" | "sqlite";

interface DatabaseConfigFormProps {
  onSave: (dbUrl: string, dbType: DatabaseType) => Promise<void>;
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

  const placeholders: Record<DatabaseType, string> = {
    postgresql: "postgresql://user:password@host:port/dbname",
    mysql: "mysql://user:password@host:port/dbname",
    sqlite: "file:./prisma/dev.db",
  };

  const handleSubmit = async () => {
    if (!dbUrl) return;
    await onSave(dbUrl, dbType);
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
