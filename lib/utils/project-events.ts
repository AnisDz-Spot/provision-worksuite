import { shouldUseMockData } from "@/lib/dataSource";

export type ProjectEvent = {
  id: string;
  projectId: string;
  type: "create" | "edit" | "star" | "unstar" | "delete" | "timelog";
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

export async function logProjectEvent(
  projectId: string,
  type: ProjectEvent["type"],
  data?: Record<string, any>
) {
  if (!shouldUseMockData()) {
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType: "project",
          entityId: projectId,
          action: type,
          metadata: data,
        }),
      });
      return;
    } catch (error) {
      console.error("Failed to log activity to database:", error);
    }
  }

  // Fallback to localStorage for mock mode or if DB fails
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

export async function getProjectEventsDB(
  projectId: string
): Promise<ProjectEvent[]> {
  if (!shouldUseMockData()) {
    try {
      const res = await fetch(`/api/activities?projectId=${projectId}`);
      const result = await res.json();
      if (result.success) {
        return result.activities.map((a: any) => ({
          id: a.id,
          projectId: a.entityId,
          type: a.action,
          timestamp: new Date(a.createdAt).getTime(),
          data: a.metadata,
          user: a.user, // Pass through user info for display
        }));
      }
    } catch (error) {
      console.error("Failed to fetch activities from database:", error);
    }
  }

  return readEvents()
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getProjectEvents(projectId: string): ProjectEvent[] {
  return readEvents()
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.timestamp - a.timestamp);
}
