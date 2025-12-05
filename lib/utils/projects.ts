// ---- Type Definitions ----

// Minimal project type for localStorage data
// This matches the structure stored in localStorage key "pv:projects"
export type LocalStorageProject = {
  id: string;
  name?: string;
  status?: string;
  deadline?: string;
  priority?: string;
  owner?: string;
  [key: string]: unknown; // Allow additional fields
};

// Read projects from localStorage
export function readProjects(): LocalStorageProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projects");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
