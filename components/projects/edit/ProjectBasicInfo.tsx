import { Button } from "@/components/ui/Button";
import { Project } from "@/hooks/useProjectEditData";
import { X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

interface ProjectBasicInfoProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
}

export function ProjectBasicInfo({
  project,
  setProject,
}: ProjectBasicInfoProps) {
  const { showToast } = useToast();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Title</label>
        <input
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          value={project.name || ""}
          onChange={(e) =>
            setProject((p) => (p ? { ...p, name: e.target.value } : p))
          }
          placeholder="Title"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Image</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={project.cover || ""}
            onChange={(e) =>
              setProject((p) => (p ? { ...p, cover: e.target.value } : p))
            }
            placeholder="https://..."
          />
          <input
            type="file"
            id="cover-upload"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 2 * 1024 * 1024) {
                  showToast("Image must be less than 2MB", "error");
                  e.target.value = "";
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () => {
                  setProject((p) =>
                    p ? { ...p, cover: reader.result as string } : p
                  );
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-[42px] shrink-0"
            onClick={() => document.getElementById("cover-upload")?.click()}
          >
            Upload
          </Button>
        </div>
        {project.cover && (
          <div className="mt-3 rounded-lg border border-border overflow-hidden bg-muted relative group">
            <Image
              src={project.cover}
              alt="Project cover preview"
              width={800}
              height={192}
              className="w-full h-48 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                const parent = (e.target as HTMLElement).parentElement;
                if (parent && !parent.querySelector(".error-message")) {
                  const errorDiv = document.createElement("div");
                  errorDiv.className =
                    "error-message flex items-center justify-center h-48 text-sm text-muted-foreground";
                  errorDiv.textContent = "Invalid image URL";
                  parent.appendChild(errorDiv);
                }
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = "block";
                const parent = (e.target as HTMLElement).parentElement;
                const errorDiv = parent?.querySelector(".error-message");
                if (errorDiv) errorDiv.remove();
              }}
            />
            <button
              type="button"
              onClick={() => setProject((p) => (p ? { ...p, cover: "" } : p))}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/90 text-white hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Enter URL or upload an image (max 2MB)
        </p>
      </div>
    </div>
  );
}
