// ---- Project Dependencies Utilities ----
// Stored key: pv:projectDeps
// Structure: Array<{ projectId: string; dependsOn: string[] }>

export type ProjectDeps = { projectId: string; dependsOn: string[] };

function readDeps(): ProjectDeps[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectDeps");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeDeps(deps: ProjectDeps[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectDeps", JSON.stringify(deps));
  } catch {}
}

export function getProjectDependencies(projectId: string): string[] {
  const all = readDeps();
  const found = all.find((d) => d.projectId === projectId);
  return found ? found.dependsOn : [];
}

export function setProjectDependencies(projectId: string, dependsOn: string[]) {
  const all = readDeps();
  const next = all.some((d) => d.projectId === projectId)
    ? all.map((d) => (d.projectId === projectId ? { ...d, dependsOn } : d))
    : [...all, { projectId, dependsOn }];
  writeDeps(next);
}

export function addProjectDependency(projectId: string, depId: string) {
  if (projectId === depId) return; // prevent self dependency
  const current = getProjectDependencies(projectId);
  if (current.includes(depId)) return;
  setProjectDependencies(projectId, [...current, depId]);
}

export function removeProjectDependency(projectId: string, depId: string) {
  const current = getProjectDependencies(projectId);
  setProjectDependencies(
    projectId,
    current.filter((id) => id !== depId)
  );
}

// Reverse lookup (projects that depend on this one)
export function getDependentsOf(projectId: string): string[] {
  return readDeps()
    .filter((d) => d.dependsOn.includes(projectId))
    .map((d) => d.projectId);
}

// Incomplete dependency ids for a project (dependency projects not marked Completed)
export function getIncompleteDependencyIds(projectId: string): string[] {
  const deps = getProjectDependencies(projectId);
  if (deps.length === 0) return [];
  try {
    const raw = localStorage.getItem("pv:projects");
    const projects: Array<{ id: string; status?: string }> = raw
      ? JSON.parse(raw)
      : [];
    return deps.filter((depId) => {
      const dep = projects.find((p) => p.id === depId);
      return dep && dep.status !== "Completed";
    });
  } catch {
    return deps;
  }
}
