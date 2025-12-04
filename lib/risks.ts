export type RiskLevelId = "critical" | "high" | "medium" | "low" | string;

export type RiskLevelConfig = {
  id: RiskLevelId;
  label: string;
  colorClasses: string; // tailwind classes for text/bg/border
  order: number; // for sorting
};

const STORAGE_KEY = "pv:riskLevels";

export const DEFAULT_RISK_LEVELS: RiskLevelConfig[] = [
  {
    id: "critical",
    label: "Critical",
    colorClasses: "text-red-600 bg-red-500/10 border-red-500/20",
    order: 10,
  },
  {
    id: "high",
    label: "High",
    colorClasses: "text-orange-600 bg-orange-500/10 border-orange-500/20",
    order: 20,
  },
  {
    id: "medium",
    label: "Medium",
    colorClasses: "text-amber-600 bg-amber-500/10 border-amber-500/20",
    order: 30,
  },
  {
    id: "low",
    label: "Low",
    colorClasses: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    order: 40,
  },
];

export async function loadRiskLevels(): Promise<RiskLevelConfig[]> {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return DEFAULT_RISK_LEVELS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_RISK_LEVELS;
    return parsed;
  } catch {
    return DEFAULT_RISK_LEVELS;
  }
}

export async function saveRiskLevels(levels: RiskLevelConfig[]) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
    }
  } catch {}
}
