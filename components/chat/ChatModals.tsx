"use client";

import React from "react";
import Image from "next/image";
import { X, File, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface ChatModalsProps {
  // File Preview
  previewFile: any | null;
  setPreviewFile: (file: any | null) => void;

  // Create Group
  showCreateGroup: boolean;
  setShowCreateGroup: (val: boolean) => void;
  newGroup: {
    name: string;
    description: string;
    members: string[];
    isPrivate: boolean;
    projectId?: number;
  };
  setNewGroup: React.Dispatch<React.SetStateAction<any>>;
  projects: any[];
  teamMembers: any[];
  toggleMember: (email: string) => void;
  handleCreateGroup: () => void;

  // Delete Confirmation
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (val: boolean) => void;
  handleClearChat: () => void;
}

export function ChatModals({
  previewFile,
  setPreviewFile,
  showCreateGroup,
  setShowCreateGroup,
  newGroup,
  setNewGroup,
  projects,
  teamMembers,
  toggleMember,
  handleCreateGroup,
  showDeleteConfirm,
  setShowDeleteConfirm,
  handleClearChat,
}: ChatModalsProps) {
  return (
    <>
      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-accent rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <div className="relative w-full aspect-square md:aspect-video flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                {previewFile.type.startsWith("image/") ? (
                  <Image
                    src={previewFile.url}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                    <File className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-foreground px-4 text-center">
                      {previewFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(previewFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full"
                    onClick={() => window.open(previewFile.url, "_blank")}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setPreviewFile(null)}
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = previewFile.url;
                  a.download = previewFile.name;
                  a.click();
                }}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewFile(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateGroup(false)}
        >
          <div
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Chat Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="p-2 hover:bg-accent rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Group Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Project Team"
                  className="w-full"
                  value={newGroup.name}
                  onChange={(e) =>
                    setNewGroup((prev: any) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  placeholder="Optional description"
                  className="w-full"
                  value={newGroup.description}
                  onChange={(e) =>
                    setNewGroup((prev: any) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Assign to Project
                </label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newGroup.projectId || ""}
                  onChange={(e) =>
                    setNewGroup((prev: any) => ({
                      ...prev,
                      projectId: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    }))
                  }
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Associate this group with a specific project context
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Add Members
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {teamMembers.map((member) => (
                    <label
                      key={member.name}
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={newGroup.members.includes(member.email)}
                        onChange={() => toggleMember(member.email)}
                      />
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role?.replace("_", " ")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private"
                  className="rounded"
                  checked={newGroup.isPrivate}
                  onChange={(e) =>
                    setNewGroup((prev: any) => ({
                      ...prev,
                      isPrivate: e.target.checked,
                    }))
                  }
                />
                <label htmlFor="private" className="text-sm">
                  Private group (only visible to members)
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateGroup}
                  disabled={!newGroup.name.trim()}
                  className="flex-1"
                >
                  Create Group
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-card border-border shadow-2xl scale-in-center overflow-hidden">
            <div className="flex items-center gap-3 text-destructive mb-4">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Delete Conversation?</h3>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              This will permanently delete all messages in this conversation.
              This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full sm:w-auto hover:bg-accent order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearChat}
                className="w-full sm:w-auto shadow-lg shadow-destructive/20 order-1 sm:order-2"
              >
                Delete Everything
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
