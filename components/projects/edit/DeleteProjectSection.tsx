import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { Project } from "@/hooks/useProjectEditData";

interface DeleteProjectSectionProps {
  project: Project;
}

export function DeleteProjectSection({ project }: DeleteProjectSectionProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteProject = async () => {
    if (deleteConfirmation !== project.name) return;
    setIsDeleting(true);
    try {
      const res = await fetchWithCsrf(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Project deleted successfully", "success");
        const { invalidateCache } = await import("@/lib/cache");
        invalidateCache("projects");
        router.push("/projects");
        router.refresh();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to delete project", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-8 border-destructive/50">
        <h3 className="text-xl font-bold text-destructive mb-4">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Once you delete a project, there is no going back. Please be certain.
        </p>
        <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
          Delete Project
        </Button>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-6 shadow-2xl border-destructive/20 from-destructive/5 to-background bg-gradient-to-b">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-destructive flex items-center gap-2">
                <span className="p-2 bg-destructive/10 rounded-full">⚠️</span>
                Delete Project?
              </h3>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. This will permanently delete the
                project <strong>{project.name}</strong> and all associated data
                (tasks, files, members).
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-uppercase text-muted-foreground font-semibold">
                Type "{project.name}" to confirm
              </label>
              <input
                className="w-full p-2 border rounded-md text-sm bg-background"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={project.name}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmation !== project.name || isDeleting}
                onClick={handleDeleteProject}
                loading={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
