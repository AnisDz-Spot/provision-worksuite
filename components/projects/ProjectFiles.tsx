"use client";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  Upload,
  File,
  Image,
  FileText,
  Trash2,
  Download,
  Eye,
  History,
} from "lucide-react";
import {
  getProjectFiles,
  addProjectFile,
  deleteProjectFile,
  formatFileSize,
  ProjectFile,
} from "@/lib/utils";
import { useToaster } from "@/components/ui/Toaster";

interface ProjectFilesProps {
  projectId: string;
  readOnly?: boolean;
}

export function ProjectFiles({
  projectId,
  readOnly = false,
}: ProjectFilesProps) {
  const { show } = useToaster();
  const [files, setFiles] = React.useState<ProjectFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<ProjectFile | null>(
    null
  );
  const [versionsFile, setVersionsFile] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const refresh = React.useCallback(() => {
    setFiles(getProjectFiles(projectId));
  }, [projectId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // Limit file size to 5MB for localStorage
        if (file.size > 5 * 1024 * 1024) {
          show("error", `${file.name} is too large (max 5MB)`);
          continue;
        }
        await addProjectFile(projectId, file, "You");
      }
      refresh();
      show("success", "Files uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      show("error", "Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDelete = () => {
    if (!deleteConfirm) return;
    deleteProjectFile(deleteConfirm.id);
    setDeleteConfirm(null);
    refresh();
    show("success", "File deleted");
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <Image className="w-5 h-5 text-blue-500" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const downloadFile = (file: ProjectFile) => {
    const link = document.createElement("a");
    link.href = file.dataUrl;
    link.download = file.name;
    link.click();
  };

  return (
    <>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Files & Attachments</h3>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-1" />
              {uploading ? "Uploading..." : "Upload Files"}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
          />
        </div>

        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <File className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No files attached yet</p>
            {!readOnly && (
              <p className="text-xs mt-1">
                Upload documents, images, or other files
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Group files by name, show latest version prominently */}
            {(() => {
              const grouped = files.reduce(
                (acc, f) => {
                  if (!acc[f.name]) acc[f.name] = [];
                  acc[f.name].push(f);
                  return acc;
                },
                {} as Record<string, ProjectFile[]>
              );
              const entries = Object.entries(grouped);
              return entries.map(([name, versions]) => {
                const sorted = [...versions].sort(
                  (a, b) => b.uploadedAt - a.uploadedAt
                );
                const latest = sorted[0];
                return (
                  <div
                    key={latest.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                  >
                    {getFileIcon(latest.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {latest.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        v{latest.version} • {formatFileSize(latest.size)} •{" "}
                        {latest.uploadedBy} •{" "}
                        {new Date(latest.uploadedAt).toLocaleDateString()}
                        {sorted.length > 1 && (
                          <span className="ml-2 text-primary">
                            (+{sorted.length - 1} older)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {sorted.length > 1 && (
                        <button
                          onClick={() => setVersionsFile(name)}
                          className="p-1 rounded hover:bg-accent cursor-pointer"
                          title="View Versions"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      )}
                      {(latest.type.startsWith("image/") ||
                        latest.type.includes("pdf")) && (
                        <button
                          onClick={() => setPreviewFile(latest)}
                          className="p-1 rounded hover:bg-accent cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => downloadFile(latest)}
                        className="p-1 rounded hover:bg-accent cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!readOnly && (
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              id: latest.id,
                              name: latest.name,
                            })
                          }
                          className="p-1 rounded hover:bg-accent text-destructive cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {!readOnly && (
          <p className="text-xs text-muted-foreground border-t border-border pt-3">
            Maximum file size: 5MB per file • Supported: Images, PDF, Word,
            Text, CSV, Excel
          </p>
        )}
      </Card>

      {/* Image Preview Modal */}
      {previewFile && previewFile.type.startsWith("image/") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setPreviewFile(null)}
            >
              ✕ Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewFile.dataUrl}
              alt={previewFile.name}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-sm text-center mt-2">
              {previewFile.name} (v{previewFile.version})
            </p>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewFile && previewFile.type.includes("pdf") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b flex items-center justify-between">
              <p className="text-sm font-medium">
                {previewFile.name} (v{previewFile.version})
              </p>
              <button
                className="px-3 py-1 text-sm rounded hover:bg-accent cursor-pointer"
                onClick={() => setPreviewFile(null)}
              >
                Close
              </button>
            </div>
            <iframe
              src={previewFile.dataUrl}
              className="w-full h-[80vh]"
              title={previewFile.name}
            />
          </div>
        </div>
      )}

      {/* Versions Modal */}
      <Modal
        open={!!versionsFile}
        onOpenChange={(open) => !open && setVersionsFile(null)}
        size="lg"
      >
        {versionsFile &&
          (() => {
            const versions = files
              .filter((f) => f.name === versionsFile)
              .sort((a, b) => b.uploadedAt - a.uploadedAt);
            return (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Version History: {versionsFile}
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 p-3 border rounded-md"
                    >
                      {getFileIcon(v.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Version {v.version}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(v.size)} • {v.uploadedBy} •{" "}
                          {new Date(v.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {(v.type.startsWith("image/") ||
                          v.type.includes("pdf")) && (
                          <button
                            onClick={() => {
                              setPreviewFile(v);
                              setVersionsFile(null);
                            }}
                            className="p-1 rounded hover:bg-accent cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => downloadFile(v)}
                          className="p-1 rounded hover:bg-accent cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {!readOnly && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({ id: v.id, name: v.name })
                            }
                            className="p-1 rounded hover:bg-accent text-destructive cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setVersionsFile(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* Delete Confirmation Modal */}
      {!readOnly && (
        <Modal
          open={!!deleteConfirm}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          size="sm"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delete File</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong>{deleteConfirm?.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
