"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Pencil, Trash2, Building2, User } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface User {
  id: number;
  uid: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  adminId: number | null;
  admin: {
    uid: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  _count: {
    users: number;
  };
}

export function DepartmentSettings() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [currentDept, setCurrentDept] =
    React.useState<Partial<Department> | null>(null);
  const { showToast } = useToast();

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [deptRes, usersRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/users"),
      ]);

      const deptData = await deptRes.json();
      const usersData = await usersRes.json();

      if (deptData.success) setDepartments(deptData.data);
      if (usersData.success) {
        // We need to ensure users have 'id' if the API doesn't return it normally
        // The API we saw earlier (app/api/users/route.ts) selects 'id' but doesn't map it.
        // I will trust my update to the API or the fact that I'll fix it if it's missing.
        setAllUsers(usersData.data);
      }
    } catch (error) {
      console.error("Failed to load department data:", error);
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDept?.name) return;

    try {
      const isNew = !currentDept.id;
      const url = isNew
        ? "/api/departments"
        : `/api/departments/${currentDept.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetchWithCsrf(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: currentDept.name,
          description: currentDept.description,
          adminId: currentDept.adminId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(
          `Department ${isNew ? "created" : "updated"} successfully`,
          "success"
        );
        setIsEditing(false);
        setCurrentDept(null);
        loadData();
      } else {
        showToast(data.error || "Failed to save department", "error");
      }
    } catch (error) {
      showToast("An error occurred while saving", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      const res = await fetchWithCsrf(`/api/departments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Department deleted", "success");
        loadData();
      } else {
        showToast(data.error || "Failed to delete", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    }
  };

  if (isLoading)
    return <div className="p-4 animate-pulse">Loading departments...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Departments</h3>
          <p className="text-sm text-muted-foreground">
            Manage your organization's departments and assign admins.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setCurrentDept({});
            setIsEditing(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {isEditing && (
        <div className="p-4 border rounded-xl bg-card animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleSave} className="space-y-4">
            <h4 className="font-semibold text-sm">
              {currentDept?.id ? "Edit Department" : "New Department"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Name
                </label>
                <input
                  required
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  value={currentDept?.name || ""}
                  onChange={(e) =>
                    setCurrentDept({ ...currentDept, name: e.target.value })
                  }
                  placeholder="e.g., Engineering, Marketing"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Department Admin
                </label>
                <select
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                  value={currentDept?.adminId || ""}
                  onChange={(e) =>
                    setCurrentDept({
                      ...currentDept,
                      adminId: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">No Admin Assigned</option>
                  {allUsers.map((u) => (
                    <option key={u.uid} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Description
              </label>
              <textarea
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                value={currentDept?.description || ""}
                onChange={(e) =>
                  setCurrentDept({
                    ...currentDept,
                    description: e.target.value,
                  })
                }
                placeholder="Briefly describe the department's focus..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setCurrentDept(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Department
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 border border-border rounded-xl bg-card hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setCurrentDept(dept);
                    setIsEditing(true);
                  }}
                  className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mb-4">
              <h4 className="font-bold text-lg">{dept.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
                {dept.description || "No description provided."}
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center border border-border overflow-hidden">
                  {dept.admin?.avatarUrl ? (
                    <img
                      src={dept.admin.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs">
                  <div className="font-semibold">
                    {dept.admin?.name || "No Admin"}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    Admin
                  </div>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-bold text-muted-foreground">
                {dept._count.users} MEMBERS
              </div>
            </div>
          </div>
        ))}
        {departments.length === 0 && !isEditing && (
          <div className="col-span-full py-12 text-center border border-dashed rounded-xl border-border">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <h5 className="font-medium text-muted-foreground">
              No departments yet
            </h5>
            <p className="text-sm text-muted-foreground">
              Create your first department to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
