"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  getAllTemplates,
  createProjectFromTemplate,
  deleteTemplate,
  ProjectTemplate,
} from "@/lib/utils";
import {
  Plus,
  Trash2,
  Rocket,
  Briefcase,
  Code,
  Megaphone,
  ShoppingCart,
} from "lucide-react";
import { useToaster } from "@/components/ui/Toaster";

const CATEGORY_ICONS: Record<string, any> = {
  "Software Development": Code,
  Marketing: Megaphone,
  Business: Briefcase,
  "E-commerce": ShoppingCart,
  Other: Rocket,
};

export default function TemplatesPage() {
  const router = useRouter();
  const { show } = useToaster();
  const [templates, setTemplates] = React.useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    React.useState<ProjectTemplate | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [projectName, setProjectName] = React.useState("");
  const [owner, setOwner] = React.useState("You");
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [filterCategory, setFilterCategory] = React.useState<string>("all");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      loadTemplates();
    }
  }, []);

  function loadTemplates() {
    setTemplates(getAllTemplates());
  }

  function handleCreateProject() {
    if (!selectedTemplate || !projectName.trim()) return;
    try {
      const projectId = createProjectFromTemplate(
        selectedTemplate.id,
        projectName.trim(),
        owner,
        startDate
      );
      setModalOpen(false);
      setProjectName("");
      show("success", "Project created from template");
      router.push(`/projects/${projectId}`);
    } catch (err) {
      show("error", "Failed to create project from template");
    }
  }

  function onDelete() {
    if (!deleteConfirm) return;
    deleteTemplate(deleteConfirm.id);
    setDeleteConfirm(null);
    loadTemplates();
    show("success", "Template deleted");
  }

  function handleDelete(id: string, name: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteConfirm({ id, name });
  }

  const categories = [
    "all",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];
  const filteredTemplates =
    filterCategory === "all"
      ? templates
      : templates.filter((t) => t.category === filterCategory);

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Project Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start new projects faster with pre-configured templates
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push("/projects")}>
          <Plus className="w-4 h-4 mr-2" />
          View Projects
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">
          Category:
        </span>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filterCategory === cat ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(cat)}
          >
            {cat === "all" ? "All" : cat}
          </Button>
        ))}
      </div>

      {templates.length === 0 ? (
        <Card className="p-12 text-center">
          <Rocket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground mb-6">
            Templates will appear here once you save a project as a template
          </p>
          <Button variant="primary" onClick={() => router.push("/projects")}>
            Go to Projects
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = CATEGORY_ICONS[template.category] || Rocket;
            return (
              <Card
                key={template.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  setSelectedTemplate(template);
                  setProjectName("");
                  setModalOpen(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => handleDelete(template.id, template.name, e)}
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" pill>
                    {template.category}
                  </Badge>
                  {template.projectData.priority && (
                    <Badge
                      variant={
                        template.projectData.priority === "high"
                          ? "warning"
                          : template.projectData.priority === "medium"
                            ? "info"
                            : "secondary"
                      }
                      pill
                    >
                      {template.projectData.priority}
                    </Badge>
                  )}
                </div>

                <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Tasks:</span>
                    <span className="font-medium text-foreground">
                      {template.tasks.length}
                    </span>
                  </div>
                  {template.milestones && template.milestones.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span>Milestones:</span>
                      <span className="font-medium text-foreground">
                        {template.milestones.length}
                      </span>
                    </div>
                  )}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-accent text-[10px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen} size="md">
        {selectedTemplate && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">
                Create Project from Template
              </h3>
              <p className="text-sm text-muted-foreground">
                Using template:{" "}
                <span className="font-medium text-foreground">
                  {selectedTemplate.name}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Project Name
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Owner</label>
                <Input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Project owner..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="p-4 rounded-lg bg-accent/20 space-y-2 text-sm">
                <div className="font-medium">This template includes:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• {selectedTemplate.tasks.length} tasks</li>
                  {selectedTemplate.milestones &&
                    selectedTemplate.milestones.length > 0 && (
                      <li>• {selectedTemplate.milestones.length} milestones</li>
                    )}
                  <li>• {selectedTemplate.tags.length} tags</li>
                  <li>• Pre-configured settings and structure</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateProject}
                disabled={!projectName.trim()}
              >
                <Rocket className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        size="sm"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Delete Template</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
