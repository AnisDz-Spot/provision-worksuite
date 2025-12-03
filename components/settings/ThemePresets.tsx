"use client";
import { useSettings } from "@/components/settings/SettingsProvider";

const PRESETS: { name: string; color: string }[] = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Emerald", color: "#10b981" },
  { name: "Rose", color: "#ef4444" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Slate", color: "#64748b" },
  { name: "Pink", color: "#ec4899" },
  { name: "Indigo", color: "#6366f1" },
];

export function ThemePresets() {
  const { workspace, updateWorkspace } = useSettings();
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Choose a primary color preset
      </div>
      <div className="grid grid-cols-4 gap-3 max-w-sm">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() =>
              updateWorkspace({ ...workspace, primaryColor: p.color })
            }
            className={`relative h-12 rounded-lg border transition-transform hover:-translate-y-0.5 ${
              workspace.primaryColor.toLowerCase() === p.color.toLowerCase()
                ? "ring-2 ring-offset-2 ring-primary"
                : ""
            }`}
            aria-label={`Set theme ${p.name}`}
            title={p.name}
          >
            <span
              className="absolute inset-1 rounded-md"
              style={{ backgroundColor: p.color }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
