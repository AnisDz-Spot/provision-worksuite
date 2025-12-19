"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DEFAULT_ROLES, loadRoles, saveRoles, RoleConfig } from "@/lib/roles";
import { useToaster } from "@/components/ui/Toaster";
import {
  Plus,
  Trash2,
  MoveVertical,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";

export default function RolesSettings() {
  const { isAdmin: isAuthAdmin } = useAuth();
  const [roles, setRoles] = React.useState<RoleConfig[]>(DEFAULT_ROLES);
  const [saving, setSaving] = React.useState(false);
  const { show } = useToaster();

  // Use the isAdmin from AuthContext if available, otherwise fallback to local check
  const isAdmin = isAuthAdmin;

  React.useEffect(() => {
    loadRoles().then(setRoles);
  }, []);

  const updateRole = (idx: number, patch: Partial<RoleConfig>) => {
    setRoles((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch } as RoleConfig;
      return next;
    });
  };

  const addRole = () => {
    const id = `role-${Date.now()}`;
    setRoles((prev) => [
      ...prev,
      {
        id,
        name: "New Role",
        description: "",
        colorClasses: "bg-accent text-foreground",
        order: prev.length * 10 + 10,
      },
    ]);
  };

  const removeRole = (idx: number) => {
    setRoles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setRoles((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(idx - 1, 0, item);
      return next.map((r, i) => ({ ...r, order: (i + 1) * 10 }));
    });
  };

  const moveDown = (idx: number) => {
    if (idx === roles.length - 1) return;
    setRoles((prev) => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(idx + 1, 0, item);
      return next.map((r, i) => ({ ...r, order: (i + 1) * 10 }));
    });
  };

  const save = async () => {
    // Client-side validation: required fields and unique IDs
    const missing = roles.find(
      (r) =>
        !r.id ||
        !r.name ||
        typeof r.id !== "string" ||
        typeof r.name !== "string"
    );
    if (missing) {
      show("error", "Each role must have a string 'ID' and 'Name'.");
      return;
    }
    const ids = new Set<string>();
    for (const r of roles) {
      if (ids.has(r.id)) {
        show("error", `Duplicate role ID detected: ${r.id}`);
        return;
      }
      ids.add(r.id);
    }
    setSaving(true);
    try {
      const refreshed = await saveRoles(roles);
      if (Array.isArray(refreshed)) {
        setRoles(refreshed);
        show("success", "Roles saved successfully.");
      } else {
        show("success", "Roles saved.");
      }
    } catch (e: any) {
      show("error", e?.message || "Failed to save roles");
    }
    setSaving(false);
  };

  const reset = async () => {
    setRoles(DEFAULT_ROLES);
    await saveRoles(DEFAULT_ROLES);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage roles available to your teams. Only admins can modify roles.
          </p>
        </div>
        {!isAdmin && (
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole className="w-4 h-4" /> Restricted (view-only)
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role, idx) => (
          <div key={idx} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: (role.colorHex || "#6366F1") + "20",
                  color: role.colorHex || "#6366F1",
                }}
              >
                {role.name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1 rounded hover:bg-background/70"
                  title="Move up"
                  onClick={() => moveUp(idx)}
                  disabled={!isAdmin}
                >
                  <MoveVertical className="w-4 h-4 rotate-180" />
                </button>
                <button
                  className="p-1 rounded hover:bg-background/70"
                  title="Move down"
                  onClick={() => moveDown(idx)}
                  disabled={!isAdmin}
                >
                  <MoveVertical className="w-4 h-4" />
                </button>
                <button
                  className="p-1 rounded hover:bg-background/70 text-destructive"
                  title="Delete"
                  onClick={() => removeRole(idx)}
                  disabled={!isAdmin}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <Input
                  value={role.name}
                  onChange={(e) => updateRole(idx, { name: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">ID</label>
                <Input
                  value={role.id}
                  onChange={(e) => updateRole(idx, { id: e.target.value })}
                  disabled={!isAdmin}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">
                  Description
                </label>
                <Input
                  value={role.description || ""}
                  onChange={(e) =>
                    updateRole(idx, { description: e.target.value })
                  }
                  disabled={!isAdmin}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-muted-foreground">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={role.colorHex || "#6366F1"}
                  onChange={(e) =>
                    updateRole(idx, { colorHex: e.target.value })
                  }
                  disabled={!isAdmin}
                  className="w-12 h-8 p-0 border border-border rounded"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-4">
        <Button onClick={addRole} disabled={!isAdmin}>
          <Plus className="w-4 h-4 mr-1" /> Add Role
        </Button>
        <Button variant="outline" onClick={reset} disabled={!isAdmin}>
          Reset to Default
        </Button>
        <Button
          className="ml-auto"
          onClick={save}
          disabled={!isAdmin || saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
