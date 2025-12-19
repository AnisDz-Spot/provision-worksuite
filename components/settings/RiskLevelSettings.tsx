"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  DEFAULT_RISK_LEVELS,
  loadRiskLevels,
  saveRiskLevels,
  RiskLevelConfig,
} from "@/lib/risks";
import { Trash2 } from "lucide-react";

export default function RiskLevelSettings() {
  const [levels, setLevels] =
    React.useState<RiskLevelConfig[]>(DEFAULT_RISK_LEVELS);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    loadRiskLevels().then(setLevels);
  }, []);

  const updateLevel = (idx: number, patch: Partial<RiskLevelConfig>) => {
    setLevels((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch } as RiskLevelConfig;
      return next;
    });
  };

  const addLevel = () => {
    const id = `custom-${Date.now()}`;
    setLevels((prev) => [
      ...prev,
      {
        id,
        label: "Custom",
        colorClasses: "text-gray-700 bg-gray-500/10 border-gray-500/20",
        order: prev.length * 10 + 10,
      },
    ]);
  };

  const removeLevel = (idx: number) => {
    setLevels((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    await saveRiskLevels(levels);
    setSaving(false);
  };

  const reset = async () => {
    setLevels(DEFAULT_RISK_LEVELS);
    await saveRiskLevels(DEFAULT_RISK_LEVELS);
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-3">Risk Levels</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Configure risk levels used for filters and badges. Adjust labels, accent
        colors, and order.
      </p>
      <div className="space-y-4">
        {levels.map((lvl, idx) => (
          <div
            key={lvl.id}
            className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border bg-accent/5"
          >
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
                  Label
                </label>
                <Input
                  value={lvl.label}
                  onChange={(e) => updateLevel(idx, { label: e.target.value })}
                  placeholder="e.g., Critical"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
                  Identifier (ID)
                </label>
                <Input
                  value={lvl.id}
                  onChange={(e) => updateLevel(idx, { id: e.target.value })}
                  placeholder="e.g., critical"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={lvl.colorHex || "#6366F1"}
                    onChange={(e) =>
                      updateLevel(idx, { colorHex: e.target.value })
                    }
                    className="w-10 h-10 p-0 border border-border rounded-lg cursor-pointer bg-transparent"
                  />
                  <Input
                    value={lvl.colorHex || ""}
                    onChange={(e) =>
                      updateLevel(idx, { colorHex: e.target.value })
                    }
                    placeholder="#HEX"
                    className="w-24 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
                  Order
                </label>
                <Input
                  type="number"
                  value={lvl.order}
                  onChange={(e) =>
                    updateLevel(idx, { order: Number(e.target.value) })
                  }
                  className="w-20"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => removeLevel(idx)}
                className="text-destructive hover:bg-destructive/10 border-destructive/20"
                title="Remove Level"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={addLevel}>Add Level</Button>
        <Button variant="outline" onClick={reset}>
          Reset to Default
        </Button>
        <Button onClick={save} disabled={saving} className="ml-auto">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
