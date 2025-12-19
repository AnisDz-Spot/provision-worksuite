export type RoleId = string;

export type RoleConfig = {
  id: RoleId;
  name: string;
  description?: string;
  colorClasses?: string; // Tailwind classes for accent color (legacy)
  colorHex?: string; // Hex color for accent
  order: number;
};

const STORAGE_KEY = "pv:roles";

export const DEFAULT_ROLES: RoleConfig[] = [
  {
    id: "project-manager",
    name: "Project Manager",
    description: "Plans and oversees delivery",
    colorHex: "#6366F1",
    order: 10,
  },
  {
    id: "developer",
    name: "Developer",
    description: "Implements features and fixes bugs",
    colorHex: "#22C55E",
    order: 20,
  },
  {
    id: "designer",
    name: "Designer",
    description: "Designs UI/UX and assets",
    colorHex: "#EC4899",
    order: 30,
  },
  {
    id: "qa",
    name: "QA",
    description: "Ensures quality through testing",
    colorHex: "#EAB308",
    order: 40,
  },
  {
    id: "devops",
    name: "DevOps",
    description: "Maintains infrastructure and pipelines",
    colorHex: "#3B82F6",
    order: 50,
  },
];

export async function loadRoles(): Promise<RoleConfig[]> {
  try {
    // If in database mode, fetch from API
    if (typeof window === "undefined") {
      // server-side can read from DB directly via API fetch
      // but keep defaults to avoid SSR coupling
      return DEFAULT_ROLES;
    }
    const { shouldUseDatabaseData } = await import("./dataSource");
    if (shouldUseDatabaseData && shouldUseDatabaseData()) {
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (json?.success && Array.isArray(json.data)) {
        if (json.data.length === 0) {
          // If DB is empty, seed with defaults and return them
          await saveRoles(DEFAULT_ROLES);
          return DEFAULT_ROLES;
        }
        // Map DB fields to RoleConfig
        return json.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description || undefined,
          colorHex: r.color_hex || r.colorHex || undefined,
          order: r.order ?? 0,
        }));
      }
    }
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return DEFAULT_ROLES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ROLES;
    return parsed;
  } catch {
    return DEFAULT_ROLES;
  }
}

export async function saveRoles(
  roles: RoleConfig[]
): Promise<RoleConfig[] | void> {
  try {
    if (typeof window !== "undefined") {
      const { shouldUseDatabaseData } = await import("./dataSource");
      if (shouldUseDatabaseData && shouldUseDatabaseData()) {
        // Batch upsert via API
        const payload = roles.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description || null,
          color_hex: role.colorHex || null,
          order: role.order ?? 0,
        }));
        const res = await fetch("/api/roles", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const refreshed: RoleConfig[] = json.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description || undefined,
            colorHex: r.color_hex || r.colorHex || undefined,
            order: r.order ?? 0,
          }));
          // Also update localStorage for offline fallback
          localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
          return refreshed;
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
        return roles;
      }
    }
  } catch {}
}
