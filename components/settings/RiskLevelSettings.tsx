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
        Configure risk levels used for filters and badges. Adjust labels, colors
        (Tailwind classes), and order.
      </p>
      <div className="space-y-3">
        {levels.map((lvl, idx) => (
          <div
            key={lvl.id}
            className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center"
          >
            <Input
              value={lvl.label}
              onChange={(e) => updateLevel(idx, { label: e.target.value })}
              placeholder="Label"
            />
            <Input
              value={lvl.id}
              onChange={(e) => updateLevel(idx, { id: e.target.value })}
              placeholder="ID (e.g., high)"
            />
            <Input
              value={lvl.colorClasses}
              onChange={(e) =>
                updateLevel(idx, { colorClasses: e.target.value })
              }
              placeholder="Tailwind color classes"
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={lvl.order}
                onChange={(e) =>
                  updateLevel(idx, { order: Number(e.target.value) })
                }
                placeholder="Order"
              />
              <Button variant="outline" onClick={() => removeLevel(idx)}>
                Remove
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
