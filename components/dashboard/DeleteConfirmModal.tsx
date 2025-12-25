"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmModalProps {
  project: { id: string; name: string } | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function DeleteConfirmModal({
  project,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [deleteInput, setDeleteInput] = React.useState("");

  React.useEffect(() => {
    if (project) {
      setDeleteInput("");
    }
  }, [project]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{project.name}</span>?
          This action cannot be undone.
        </p>
        <label
          htmlFor="confirm-delete-input"
          className="text-sm text-muted-foreground mb-2 block"
        >
          Type the project name to confirm:
        </label>
        <input
          id="confirm-delete-input"
          name="confirmProjectName"
          type="text"
          value={deleteInput}
          onChange={(e) => setDeleteInput(e.target.value)}
          placeholder={project.name}
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(project.id)}
            disabled={deleteInput !== project.name}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
