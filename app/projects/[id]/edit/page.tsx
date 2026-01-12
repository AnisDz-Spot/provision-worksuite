"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { ProjectDependencies } from "@/components/projects/ProjectDependencies";
import { ProjectFiles } from "@/components/projects/ProjectFiles";
import { log } from "@/lib/logger";

// Hook
import { useProjectEditData } from "@/hooks/useProjectEditData";

// Components
import { ProjectBasicInfo } from "@/components/projects/edit/ProjectBasicInfo";
import { ProjectDetailsForm } from "@/components/projects/edit/ProjectDetailsForm";
import { ProjectClientBudget } from "@/components/projects/edit/ProjectClientBudget";
import { ProjectTaxonomy } from "@/components/projects/edit/ProjectTaxonomy";
import { ProjectMembersForm } from "@/components/projects/edit/ProjectMembersForm";
import { DeleteProjectSection } from "@/components/projects/edit/DeleteProjectSection";

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params.id as string;

  const {
    project,
    setProject,
    loading,
    users,
    clients,
    allProjects,
    allCategories,
    setAllCategories,
    departments,
  } = useProjectEditData(projectId);

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    if (!project || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetchWithCsrf(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          deadline: project.deadline,
          budget: project.budget,
          clientId: project.clientId,
          clientName: project.client,
          tags: project.tags,
          categories: project.categories,
          visibility: project.privacy,
          cover: project.cover,
          sla: project.sla,
          isTemplate: project.isTemplate,
          departmentId: project.departmentId,
          members: (project.members || []).map((m) => m.uid).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Failed to update");
      const savedProject = await res.json();
      const nextId = savedProject.project?.slug || projectId;

      showToast("Project saved successfully", "success");

      // Force cache invalidation
      const { invalidateCache } = await import("@/lib/cache");
      invalidateCache("projects");

      router.push(`/projects/${nextId}`);
    } catch (error) {
      log.error({ err: error }, "Failed to save project");
      showToast("Failed to save project", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project not found
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
      {isSaving && (
        <div className="fixed inset-0 z-100 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="p-8 flex flex-col items-center gap-4 shadow-2xl scale-110">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-xl font-bold">Saving Changes...</div>
            <p className="text-muted-foreground animate-pulse text-sm">
              Updating project metadata and members
            </p>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <div className="w-32" />
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <ProjectBasicInfo project={project} setProject={setProject} />

          <ProjectDetailsForm
            project={project}
            setProject={setProject}
            departments={departments}
          />

          <ProjectClientBudget
            project={project}
            setProject={setProject}
            clients={clients}
          />

          <ProjectTaxonomy
            project={project}
            setProject={setProject}
            allCategories={allCategories}
            setAllCategories={setAllCategories}
          />

          <ProjectMembersForm
            project={project}
            setProject={setProject}
            users={users}
          />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      <DeleteProjectSection project={project} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProjectDependencies
          projectId={project.id}
          availableProjects={allProjects}
        />
        <ProjectFiles projectId={project.id} />
      </div>
    </section>
  );
}
