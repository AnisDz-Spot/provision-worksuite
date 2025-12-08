"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Users,
  Settings,
  Crown,
  Edit2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ChatGroup = {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Mock team members for demo
const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "project_manager",
  },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "member" },
  { id: "3", name: "Carol Davis", email: "carol@example.com", role: "member" },
  { id: "4", name: "David Lee", email: "david@example.com", role: "admin" },
  {
    id: "5",
    name: "Eve Wilson",
    email: "eve@example.com",
    role: "project_manager",
  },
  { id: "6", name: "Frank Miller", email: "frank@example.com", role: "admin" },
];

export function ChatGroupSettings() {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    members: [] as string[],
    isPrivate: false,
  });
  const [currentUserRole] = useState<string>("admin"); // In real app, get from auth context

  // Only admins and project managers can manage chat groups
  const canManageGroups =
    currentUserRole === "admin" || currentUserRole === "project_manager";

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    try {
      const stored = localStorage.getItem("pv:chatGroups");
      if (stored) {
        setGroups(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load chat groups:", error);
    }
  };

  const saveGroups = (updatedGroups: ChatGroup[]) => {
    setGroups(updatedGroups);
    localStorage.setItem("pv:chatGroups", JSON.stringify(updatedGroups));
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return;

    const group: ChatGroup = {
      id: `group_${Date.now()}`,
      name: newGroup.name.trim(),
      description: newGroup.description.trim() || undefined,
      members: newGroup.members,
      createdBy: "Current User", // In real app, use actual user
      createdAt: new Date().toISOString(),
      isPrivate: newGroup.isPrivate,
    };

    saveGroups([...groups, group]);
    setNewGroup({ name: "", description: "", members: [], isPrivate: false });
    setIsCreating(false);
  };

  const handleDeleteGroup = (id: string) => {
    if (confirm("Are you sure you want to delete this chat group?")) {
      saveGroups(groups.filter((g) => g.id !== id));
    }
  };

  const toggleMember = (memberId: string) => {
    setNewGroup((prev) => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter((m) => m !== memberId)
        : [...prev.members, memberId],
    }));
  };

  if (!canManageGroups) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm mt-2">
          Only administrators and project managers can manage chat groups.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Chat Groups</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage team chat groups
          </p>
        </div>
        {!isCreating && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Group
          </Button>
        )}
      </div>

      {/* Create New Group Form */}
      {isCreating && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Create New Group</h4>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewGroup({
                  name: "",
                  description: "",
                  members: [],
                  isPrivate: false,
                });
              }}
              className="p-1 hover:bg-accent rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Project Alpha Team"
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <input
                type="text"
                value={newGroup.description}
                onChange={(e) =>
                  setNewGroup((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Add Members
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-background">
                {MOCK_TEAM_MEMBERS.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                      newGroup.members.includes(member.id)
                        ? "bg-primary/10 border-primary border"
                        : "hover:bg-accent"
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {member.role.replace("_", " ")}
                      </p>
                    </div>
                    {newGroup.members.includes(member.id) && (
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newGroup.isPrivate}
                onChange={(e) =>
                  setNewGroup((prev) => ({
                    ...prev,
                    isPrivate: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <label htmlFor="isPrivate" className="text-sm">
                Private group (only visible to members)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewGroup({
                    name: "",
                    description: "",
                    members: [],
                    isPrivate: false,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateGroup}
                disabled={!newGroup.name.trim()}
              >
                Create Group
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Groups List */}
      <div className="space-y-3">
        {groups.length === 0 && !isCreating ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No chat groups yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a group to start team conversations
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{group.name}</h4>
                      {group.isPrivate && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {group.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {group.members.length} member
                      {group.members.length !== 1 ? "s" : ""} • Created by{" "}
                      {group.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
