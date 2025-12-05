// ---- Project Event Logging Utilities ----
// Stored in localStorage key `pv:projectEvents`
// Shape: { id, projectId, type, timestamp, data }

export type ProjectEvent = {
  id: string;
  projectId: string;
  type: "create" | "edit" | "star" | "unstar" | "delete";
  timestamp: number;
  data?: Record<string, any>;
};

function readEvents(): ProjectEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("pv:projectEvents");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeEvents(events: ProjectEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:projectEvents", JSON.stringify(events));
  } catch {}
}

export function logProjectEvent(
  projectId: string,
  type: ProjectEvent["type"],
  data?: Record<string, any>
) {
  const ev: ProjectEvent = {
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    projectId,
    type,
    timestamp: Date.now(),
    data,
  };
  const existing = readEvents();
  existing.push(ev);
  writeEvents(existing);
}

export function getProjectEvents(projectId: string): ProjectEvent[] {
  return readEvents()
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
}
