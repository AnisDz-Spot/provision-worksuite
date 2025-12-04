import { shouldUseDatabaseData } from "./dataSource";

export type BlockerCategory =
  | "technical"
  | "resource"
  | "dependency"
  | "external"
  | "decision"
  | string;

export type CategoryConfig = {
  id: BlockerCategory;
  label: string;
  defaultOwnerGroup: string;
  slaDays: number; // target resolution time in days
  iconName: string; // emoji icon
};

export const CATEGORY_OPTIONS: CategoryConfig[] = [
  {
    id: "technical",
    label: "Technical",
    defaultOwnerGroup: "Engineering",
    slaDays: 5,
    iconName: "🔧",
  },
  {
    id: "resource",
    label: "Resource",
    defaultOwnerGroup: "Operations",
    slaDays: 7,
    iconName: "👥",
  },
  {
    id: "dependency",
    label: "Dependency",
    defaultOwnerGroup: "Program Management",
    slaDays: 3,
    iconName: "🔗",
  },
  {
    id: "external",
    label: "External",
    defaultOwnerGroup: "Vendor Management",
    slaDays: 10,
    iconName: "🌍",
  },
  {
    id: "decision",
    label: "Decision",
    defaultOwnerGroup: "Product/Stakeholders",
    slaDays: 2,
    iconName: "💭",
  },
];

export function getCategoryConfig(id: BlockerCategory): CategoryConfig {
  return CATEGORY_OPTIONS.find((c) => c.id === id) || CATEGORY_OPTIONS[0];
}

// Icon registry (subset of lucide icons commonly useful here). Add as needed.
// Keep icon registry for future use (not used with emoji mode)
export const IconRegistry: Record<string, string> = {
  Wrench: "Wrench",
  Users: "Users",
  Link: "Link",
  Globe: "Globe",
  MessageSquare: "MessageSquare",
  ShieldAlert: "ShieldAlert",
  AlertTriangle: "AlertTriangle",
  Bug: "Bug",
  Server: "Server",
  Database: "Database",
  Cpu: "Cpu",
  Cloud: "Cloud",
  Lock: "Lock",
  FileWarning: "FileWarning",
  Scale: "Scale",
  Building: "Building",
  Workflow: "Workflow",
  GitBranch: "GitBranch",
  Network: "Network",
};

// Storage helpers; if DB is enabled, still use local storage until API exists
const STORAGE_KEY = "pv:blockerCategories"; // Keep localStorage fallback

export async function loadCategoryConfigs(): Promise<CategoryConfig[]> {
  try {
    if (shouldUseDatabaseData()) {
      const res = await fetch("/api/blocker-categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // map DB rows to CategoryConfig
        return json.data.map((r: any) => ({
          id: r.id,
          label: r.label,
          defaultOwnerGroup: r.default_owner_group,
          slaDays: r.sla_days,
          iconName: r.icon_emoji, // temporarily reuse field for emoji
        }));
      }
    }
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return CATEGORY_OPTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return CATEGORY_OPTIONS;
    return parsed;
  } catch {
    return CATEGORY_OPTIONS;
  }
}

export async function saveCategoryConfigs(cfgs: CategoryConfig[]) {
  try {
    if (shouldUseDatabaseData()) {
      const payload = cfgs.map((c) => ({
        id: c.id,
        label: c.label,
        default_owner_group: c.defaultOwnerGroup,
        sla_days: c.slaDays,
        icon_emoji: c.iconName,
      }));
      await fetch("/api/blocker-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfgs));
    }
  } catch {}
}
