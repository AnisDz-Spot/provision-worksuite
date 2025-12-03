"use client";
import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, X, ArrowRight, AlertCircle } from "lucide-react";
import {
  getProjectDependencies,
  addProjectDependency,
  removeProjectDependency,
  getDependentsOf,
} from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  status?: string;
};

interface ProjectDependenciesProps {
  projectId: string;
  availableProjects: Project[];
}

export function ProjectDependencies({
  projectId,
  availableProjects,
}: ProjectDependenciesProps) {
  const [dependencies, setDependencies] = React.useState<string[]>([]);
  const [dependents, setDependents] = React.useState<string[]>([]);
  const [addMode, setAddMode] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState("");

  const refresh = React.useCallback(() => {
    setDependencies(getProjectDependencies(projectId));
    setDependents(getDependentsOf(projectId));
  }, [projectId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = () => {
    if (selectedId && selectedId !== projectId) {
      addProjectDependency(projectId, selectedId);
      refresh();
      setSelectedId("");
      setAddMode(false);
    }
  };

  const handleRemove = (depId: string) => {
    removeProjectDependency(projectId, depId);
    refresh();
  };

  const getProjectById = (id: string) =>
    availableProjects.find((p) => p.id === id);

  // Filter out self, already added dependencies, and prevent circular deps (simple check: can't add if it depends on us)
  const availableToAdd = availableProjects.filter(
    (p) =>
      p.id !== projectId &&
      !dependencies.includes(p.id) &&
      !getProjectDependencies(p.id).includes(projectId) // prevent direct circular
  );

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-primary" />
          Dependencies
        </h3>
        {!addMode && (
          <Button variant="outline" size="sm" onClick={() => setAddMode(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Dependency
          </Button>
        )}
      </div>

      {/* Current Dependencies */}
      {dependencies.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            This project depends on:
          </p>
          {dependencies.map((depId) => {
            const dep = getProjectById(depId);
            return (
              <div
                key={depId}
                className="flex items-center justify-between p-3 bg-accent rounded-md border border-border"
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{dep?.name || depId}</span>
                  {dep?.status && (
                    <Badge variant="secondary" pill>
                      {dep.status}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(depId)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove dependency"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No dependencies yet.</p>
      )}

      {/* Add Dependency UI */}
      {addMode && (
        <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border">
          <p className="text-sm font-medium">
            Select a project this depends on:
          </p>
          {availableToAdd.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              No available projects to add (avoiding circular dependencies)
            </div>
          ) : (
            <>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">-- Select Project --</option>
                {availableToAdd.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.status ? `(${p.status})` : ""}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAdd}
                  disabled={!selectedId}
                >
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddMode(false);
                    setSelectedId("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dependents (projects that depend on this one) */}
      {dependents.length > 0 && (
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-sm text-muted-foreground">
            Projects that depend on this one:
          </p>
          {dependents.map((depId) => {
            const dep = getProjectById(depId);
            return (
              <div
                key={depId}
                className="flex items-center gap-2 p-2 bg-card rounded-md border border-border"
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                <span className="text-sm">{dep?.name || depId}</span>
                {dep?.status && (
                  <Badge variant="secondary" pill>
                    {dep.status}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
