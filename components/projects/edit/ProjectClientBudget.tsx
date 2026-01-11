import { Project } from "@/hooks/useProjectEditData";

interface ProjectClientBudgetProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  clients: any[];
}

export function ProjectClientBudget({
  project,
  setProject,
  clients,
}: ProjectClientBudgetProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Client</label>
        <select
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          value={project.clientId || ""}
          onChange={(e) => {
            const cid = e.target.value;
            const c = clients.find((cl) => cl.id === cid);
            setProject((p) =>
              p ? { ...p, clientId: cid, client: c?.name || "" } : p
            );
          }}
        >
          <option value="">-- Select Client --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Budget (USD)</label>
        <input
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          value={project.budget || ""}
          onChange={(e) =>
            setProject((p) => (p ? { ...p, budget: e.target.value } : p))
          }
          placeholder="e.g., 50000"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">
          <abbr
            className="border-b border-dashed border-current no-underline cursor-help"
            title="Service Level Agreement"
          >
            SLA
          </abbr>{" "}
          Target (days)
        </label>
        <input
          className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
          value={project.sla || ""}
          onChange={(e) =>
            setProject((p) => (p ? { ...p, sla: e.target.value } : p))
          }
          placeholder="e.g., 30"
        />
      </div>
      <div className="space-y-2 flex items-end pb-1">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={project.isTemplate || false}
            onChange={(e) =>
              setProject((p) =>
                p ? { ...p, isTemplate: e.target.checked } : p
              )
            }
            className="w-4 h-4 rounded border-border"
          />
          Mark as Template
        </label>
      </div>
    </div>
  );
}
