import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Project } from "@/hooks/useProjectEditData";

interface ProjectDetailsFormProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  departments?: any[];
}

export function ProjectDetailsForm({
  project,
  setProject,
  departments = [],
}: ProjectDetailsFormProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 col-span-full">
          <label className="text-sm font-medium">Description</label>
          <RichTextEditor
            value={project.description || ""}
            onChange={(value) =>
              setProject((p) => (p ? { ...p, description: value } : p))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Department</label>
          <select
            className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={project.departmentId || ""}
            onChange={(e) =>
              setProject((p) =>
                p ? { ...p, departmentId: e.target.value } : p
              )
            }
          >
            <option value="">No Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={project.priority || "medium"}
            onChange={(e) =>
              setProject((p) =>
                p ? { ...p, priority: e.target.value as any } : p
              )
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={project.status}
            onChange={(e) =>
              setProject((p) =>
                p ? { ...p, status: e.target.value as any } : p
              )
            }
          >
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="Paused">Paused</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline</label>
          <input
            type="date"
            className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={project.deadline || ""}
            onChange={(e) =>
              setProject((p) => (p ? { ...p, deadline: e.target.value } : p))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Privacy</label>
          <select
            className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            value={project.privacy || "team"}
            onChange={(e) =>
              setProject((p) =>
                p ? { ...p, privacy: e.target.value as any } : p
              )
            }
          >
            <option value="public">Public</option>
            <option value="team">Team</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
    </>
  );
}
