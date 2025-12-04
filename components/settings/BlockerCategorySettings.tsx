"use client";
import * as React from "react";
import {
  CATEGORY_OPTIONS,
  CategoryConfig,
  BlockerCategory,
  loadCategoryConfigs,
  saveCategoryConfigs,
} from "@/lib/blockers";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Use shared helpers from lib/blockers

export function BlockerCategorySettings() {
  const [configs, setConfigs] =
    React.useState<CategoryConfig[]>(CATEGORY_OPTIONS);
  const [dirty, setDirty] = React.useState(false);
  const [newCat, setNewCat] = React.useState<{
    id: string;
    label: string;
    owner: string;
    sla: number;
    iconEmoji: string;
  }>({ id: "", label: "", owner: "", sla: 3, iconEmoji: "🔧" });
  const [emojiList] = React.useState<string[]>([
    "🔧",
    "👥",
    "🔗",
    "🌐",
    "💭",
    "⚠️",
    "🐞",
    "🛡️",
    "🧪",
    "📦",
    "🔒",
    "🧠",
    "📈",
    "📉",
    "📊",
    "⚙️",
    "🗂️",
    "🏗️",
    "🏛️",
    "⚖️",
    "🛰️",
    "🧰",
    "💡",
    "🚧",
    "⛓️",
    "🕒",
  ]);
  const [emojiPickerOpen, setEmojiPickerOpen] = React.useState<string | null>(
    null
  );
  const [newCatEmojiPickerOpen, setNewCatEmojiPickerOpen] =
    React.useState(false);

  React.useEffect(() => {
    loadCategoryConfigs().then(setConfigs);
  }, []);

  const updateField = (
    id: BlockerCategory,
    field: keyof CategoryConfig,
    value: any
  ) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    setDirty(true);
  };

  const handleSave = () => {
    saveCategoryConfigs(configs);
    setDirty(false);
  };

  const handleReset = () => {
    setConfigs(CATEGORY_OPTIONS);
    setDirty(true);
  };

  const handleAdd = () => {
    const id = newCat.id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id) return;
    if (configs.some((c) => c.id === id)) return;
    const entry: CategoryConfig = {
      id: id as BlockerCategory,
      label: newCat.label.trim() || newCat.id,
      defaultOwnerGroup: newCat.owner.trim() || "General",
      slaDays: Math.max(1, newCat.sla || 3),
      iconName: newCat.iconEmoji || "🔧",
    } as any;
    setConfigs((prev) => [...prev, entry]);
    setDirty(true);
    setNewCat({ id: "", label: "", owner: "", sla: 3, iconEmoji: "🔧" });
  };

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Blocker Categories</h2>
        <p className="text-sm text-muted-foreground">
          Configure category labels, default owner groups, and target SLA days.
          Changes persist locally and work in production without server setup.
        </p>
      </div>

      <div className="space-y-4">
        {configs.map((c) => (
          <div key={c.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.icon}</span>
                <span className="font-medium capitalize">
                  {c.id.replace("-", " ")}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">ID: {c.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Label</label>
                <Input
                  value={c.label}
                  onChange={(e) => updateField(c.id, "label", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Default Owner Group
                </label>
                <Input
                  value={c.defaultOwnerGroup}
                  onChange={(e) =>
                    updateField(c.id, "defaultOwnerGroup", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Target SLA (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={c.slaDays}
                  onChange={(e) =>
                    updateField(
                      c.id,
                      "slaDays",
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Emoji Icon
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm text-left flex items-center justify-between hover:bg-accent"
                    onClick={() =>
                      setEmojiPickerOpen(emojiPickerOpen === c.id ? null : c.id)
                    }
                  >
                    <span className="text-lg">{c.iconName}</span>
                    <span className="text-xs text-muted-foreground">
                      Click to change
                    </span>
                  </button>
                  {emojiPickerOpen === c.id && (
                    <div className="absolute z-50 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">
                          Pick an emoji
                        </span>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setEmojiPickerOpen(null)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-8 gap-1 mb-2">
                        {emojiList.map((em) => (
                          <button
                            key={em}
                            type="button"
                            className="text-xl hover:bg-accent rounded p-1 transition-colors"
                            onClick={() => {
                              updateField(c.id, "iconName", em);
                              setEmojiPickerOpen(null);
                            }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                      <input
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                        value={c.iconName}
                        onChange={(e) =>
                          updateField(c.id, "iconName", e.target.value)
                        }
                        placeholder="Or paste custom emoji"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!dirty}>
          Save Changes
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Add New Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs font-medium mb-1 block">
              ID (kebab-case)
            </label>
            <Input
              placeholder="e.g. compliance"
              value={newCat.id}
              onChange={(e) => setNewCat({ ...newCat, id: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Label</label>
            <Input
              placeholder="Compliance"
              value={newCat.label}
              onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
              Owner Group
            </label>
            <Input
              placeholder="Legal"
              value={newCat.owner}
              onChange={(e) => setNewCat({ ...newCat, owner: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">SLA (days)</label>
            <Input
              type="number"
              min={1}
              value={newCat.sla}
              onChange={(e) =>
                setNewCat({
                  ...newCat,
                  sla: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Emoji Icon</label>
            <div className="relative">
              <button
                type="button"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm text-left flex items-center justify-between hover:bg-accent"
                onClick={() => setNewCatEmojiPickerOpen(!newCatEmojiPickerOpen)}
              >
                <span className="text-lg">{newCat.iconEmoji}</span>
                <span className="text-xs text-muted-foreground">
                  Click to change
                </span>
              </button>
              {newCatEmojiPickerOpen && (
                <div className="absolute z-50 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Pick an emoji</span>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setNewCatEmojiPickerOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    {emojiList.map((em) => (
                      <button
                        key={em}
                        type="button"
                        className="text-xl hover:bg-accent rounded p-1 transition-colors"
                        onClick={() => {
                          setNewCat({ ...newCat, iconEmoji: em });
                          setNewCatEmojiPickerOpen(false);
                        }}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <input
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    value={newCat.iconEmoji}
                    onChange={(e) =>
                      setNewCat({ ...newCat, iconEmoji: e.target.value })
                    }
                    placeholder="Or paste custom emoji"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={handleAdd}>Add Category</Button>
        </div>
      </div>
    </Card>
  );
}
