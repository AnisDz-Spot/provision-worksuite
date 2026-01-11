import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToaster } from "@/components/ui/Toaster";
import { saveAsTemplate, getTasksByProject } from "@/lib/utils";
import { Project } from "@/hooks/useProjectDetails";

interface SaveTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function SaveTemplateModal({
  open,
  onOpenChange,
  project,
}: SaveTemplateModalProps) {
  const router = useRouter();
  const { show } = useToaster();

  const [templateName, setTemplateName] = useState(project.name + " Template");
  const [templateDesc, setTemplateDesc] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Other");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    setIsSaving(true);
    try {
      await saveAsTemplate(
        templateName.trim(),
        templateDesc.trim(),
        templateCategory,
        project.id
      );
      onOpenChange(false);
      show("success", "Template saved successfully");
      router.push("/templates");
    } catch (err) {
      show("error", "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-2">Save as Template</h3>
          <p className="text-sm text-muted-foreground">
            Create a reusable template from this project
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Template Name
            </label>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Describe this template..."
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={templateCategory}
              onChange={(e) => setTemplateCategory(e.target.value)}
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option value="Software Development">Software Development</option>
              <option value="Marketing">Marketing</option>
              <option value="Business">Business</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="p-4 rounded-lg bg-accent/20 space-y-2 text-sm">
            <div className="font-medium">Template will include:</div>
            <ul className="space-y-1 text-muted-foreground">
              <li>• All tasks ({getTasksByProject(project.id).length})</li>
              <li>• Project settings and configuration</li>
              <li>• Tags and categories</li>
              <li>• Task structure and priorities</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!templateName.trim() || isSaving}
            loading={isSaving}
          >
            Save Template
          </Button>
        </div>
      </div>
    </Modal>
  );
}
