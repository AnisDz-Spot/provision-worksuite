"use client";
import * as React from "react";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { addUser } from "@/components/auth/AuthContext";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  UserCircle2,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getMemberActivity, updateMemberActivity } from "@/lib/utils";

type Socials = { linkedin?: string; github?: string; twitter?: string };

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  socials: Socials;
  avatar: string;
};

const ENRICH: Record<string, Partial<TeamMember>> = {
  u1: {
    phone: "+1 (555) 010-1010",
    address: "NY, USA",
    socials: { linkedin: "alice" },
  },
  u2: {
    phone: "+213 555 123 456",
    address: "Algeria",
    socials: { github: "anisdzed" },
  },
  u3: {
    phone: "+1 (555) 010-2020",
    address: "SF, USA",
    socials: { github: "bob-dev" },
  },
  u4: {
    phone: "+44 20 7946 0123",
    address: "London, UK",
    socials: { twitter: "carol_design" },
  },
  u5: {
    phone: "+971 4 123 4567",
    address: "Dubai, UAE",
    socials: { linkedin: "david-b" },
  },
  u6: {
    phone: "+61 2 9012 3456",
    address: "Sydney, AU",
    socials: { github: "eveops" },
  },
};

const roleColors: Record<string, string> = {
  "Project Manager":
    "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "Frontend Developer":
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "UI/UX Designer":
    "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  "Backend Developer":
    "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  "DevOps Engineer":
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Developer:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Designer:
    "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
  "QA Lead":
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  DevOps:
    "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
};

type TeamTableProps = {
  onAddClick?: (fn: () => void) => void;
  onChatClick?: (memberName: string) => void;
};

export function TeamTable({ onAddClick, onChatClick }: TeamTableProps) {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [membersData, setMembersData] = useState<TeamMember[]>([]);
  const [memberActivities, setMemberActivities] = useState<Map<string, any>>(
    new Map()
  );
  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftPassword, setDraftPassword] = useState("");

  const initialMembers: TeamMember[] = useMemo(() => {
    // Load users from auth system
    if (typeof window === "undefined") return [];

    // This will be loaded asynchronously below
    return [];
  }, []);

  // Initialize membersData once
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const { loadUsers } = await import("@/lib/data");
        const users = await loadUsers();

        const teamMembers = users.map((u: any) => ({
          id: u.uid || u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          phone: ENRICH[u.uid || u.id]?.phone || "+1 (555) 000-0000",
          address: ENRICH[u.uid || u.id]?.address || "-",
          socials: ENRICH[u.uid || u.id]?.socials || {},
          avatar:
            u.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`,
        }));

        setMembersData(teamMembers);
      } catch (error) {
        console.error("Failed to load team members:", error);
        setMembersData([]);
      }
    }
    fetchUsers();
  }, []);

  // Load member activities
  React.useEffect(() => {
    const loadActivities = () => {
      const activities = new Map();
      membersData.forEach((m) => {
        activities.set(m.name, getMemberActivity(m.name));
      });
      setMemberActivities(activities);
    };
    loadActivities();
    const interval = setInterval(loadActivities, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, [membersData]);

  // Expose add function to parent
  React.useEffect(() => {
    if (onAddClick) {
      onAddClick(() => setAddOpen(true));
    }
  }, [onAddClick]);

  const members = membersData;

  const roles = useMemo(
    () => Array.from(new Set(members.map((m) => m.role))),
    [members]
  );

  const filtered = members.filter((m) => {
    const matchQ =
      q.trim().length === 0 ||
      [m.name, m.email, m.role, m.phone, m.address]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase());
    const matchR = role === "all" || m.role === role;
    return matchQ && matchR;
  });

  function toggleMenu(id: string) {
    setMenuOpen(menuOpen === id ? null : id);
  }

  function openEdit(member: TeamMember) {
    setEditMemberId(member.id);
    setDraftName(member.name);
    setDraftRole(member.role);
    setDraftEmail(member.email);
    setDraftPhone(member.phone);
    setDraftAddress(member.address);
    setEditOpen(true);
    setMenuOpen(null);
  }

  function saveEdit() {
    if (!editMemberId) return;
    setMembersData((prev) =>
      prev.map((m) =>
        m.id === editMemberId
          ? {
              ...m,
              name: draftName.trim() || m.name,
              role: draftRole.trim() || m.role,
              email: draftEmail.trim() || m.email,
              phone: draftPhone.trim() || m.phone,
              address: draftAddress.trim() || m.address,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(draftName || m.name)}`,
            }
          : m
      )
    );
    setEditOpen(false);
    setEditMemberId(null);
  }

  function addMember() {
    if (!draftName.trim() || !draftEmail.trim() || !draftPassword.trim())
      return;

    // Add user to auth system
    const newUser = addUser({
      name: draftName.trim(),
      email: draftEmail.trim(),
      role: draftRole.trim() || "Team Member",
      password: draftPassword.trim(),
    });

    const newMember: TeamMember = {
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      phone: draftPhone.trim() || "+1 (555) 000-0000",
      address: draftAddress.trim() || "-",
      socials: {},
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(draftName.trim())}`,
    };
    setMembersData((prev) => [...prev, newMember]);
    setAddOpen(false);
    setDraftName("");
    setDraftRole("");
    setDraftEmail("");
    setDraftPhone("");
    setDraftAddress("");
    setDraftPassword("");
  }

  function removeMember(id: string) {
    setMembersData((prev) => prev.filter((m) => m.id !== id));
    setMenuOpen(null);
  }

  function cycleRole(id: string) {
    const roleOrder = Object.keys(roleColors);
    setMembersData((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const idx = roleOrder.indexOf(m.role);
        const nextRole = roleOrder[(idx + 1) % roleOrder.length];
        return { ...m, role: nextRole };
      })
    );
    setMenuOpen(null);
  }

  function handleRoleChange(id: string, newRole: string) {
    setMembersData((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team members..."
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Team Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-secondary/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                Member
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                Role
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                Contact
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                Location
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground">
                Social
              </th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-secondary/30 transition-colors group"
              >
                {/* Member Column */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-10 h-10 rounded-full bg-accent ring-2 ring-accent/30"
                      />
                      {memberActivities.get(m.name) && (
                        <div
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(memberActivities.get(m.name)?.currentStatus)}`}
                        />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-sm block">
                        {m.name}
                      </span>
                      {memberActivities.get(m.name)?.currentStatus ===
                        "online" && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Active now
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Role Column */}
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${roleColors[m.role] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"}`}
                    >
                      {Object.keys(roleColors).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[m.role] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"}`}
                    >
                      {m.role}
                    </span>
                  )}
                </td>

                {/* Contact Column */}
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <a
                        href={`mailto:${m.email}`}
                        className="hover:text-primary transition-colors"
                      >
                        {m.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{m.phone}</span>
                    </div>
                  </div>
                </td>

                {/* Location Column */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{m.address}</span>
                  </div>
                </td>

                {/* Social Column */}
                <td className="px-4 py-3">
                  {m.socials.linkedin ||
                  m.socials.github ||
                  m.socials.twitter ? (
                    <div className="flex items-center gap-1">
                      {m.socials.linkedin && (
                        <a
                          href={`https://linkedin.com/in/${m.socials.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {m.socials.github && (
                        <a
                          href={`https://github.com/${m.socials.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-gray-500/10 hover:bg-gray-500/20 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                          title="GitHub"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {m.socials.twitter && (
                        <a
                          href={`https://twitter.com/${m.socials.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition-colors cursor-pointer"
                          title="Twitter"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>

                {/* Actions Column */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2 relative">
                    {onChatClick && (
                      <button
                        onClick={() => onChatClick(m.name)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          memberActivities.get(m.name)?.currentStatus ===
                          "online"
                            ? "hover:bg-green-500/10 text-green-600 dark:text-green-400"
                            : "hover:bg-secondary text-muted-foreground"
                        }`}
                        title={
                          memberActivities.get(m.name)?.currentStatus ===
                          "online"
                            ? "Start chat (online)"
                            : "Start chat"
                        }
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        title="More options"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(m.id);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}

                    {menuOpen === m.id && isAdmin && (
                      <div className="absolute right-0 top-10 z-10 bg-popover border rounded-lg shadow-md min-w-40 text-sm animate-fadeIn">
                        <button
                          onClick={() => openEdit(m)}
                          className="w-full text-left px-3 py-2 hover:bg-accent cursor-pointer"
                        >
                          Edit Member
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="w-full text-left px-3 py-2 hover:bg-destructive/20 text-destructive cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <UserCircle2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No team members found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={() => setEditOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-xl shadow-lg p-6 w-full max-w-xl space-y-6">
            <h3 className="text-lg font-semibold">Edit Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium">Name</label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Role</label>
                <Input
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Email</label>
                <Input
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Phone</label>
                <Input
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium">Address</label>
                <Input
                  value={draftAddress}
                  onChange={(e) => setDraftAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-2 rounded-md border text-sm hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
                disabled={!draftName.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              setAddOpen(false);
              setDraftName("");
              setDraftRole("");
              setDraftEmail("");
              setDraftPhone("");
              setDraftAddress("");
            }}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-xl shadow-lg p-6 w-full max-w-xl space-y-6">
            <h3 className="text-lg font-semibold">Add New Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium">Name *</label>
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Role</label>
                <Input
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value)}
                  placeholder="e.g. Developer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Email *</label>
                <Input
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Password *</label>
                <Input
                  type="password"
                  value={draftPassword}
                  onChange={(e) => setDraftPassword(e.target.value)}
                  placeholder="Initial password"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Phone</label>
                <Input
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium">Address</label>
                <Input
                  value={draftAddress}
                  onChange={(e) => setDraftAddress(e.target.value)}
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setAddOpen(false);
                  setDraftName("");
                  setDraftRole("");
                  setDraftEmail("");
                  setDraftPhone("");
                  setDraftAddress("");
                }}
                className="px-4 py-2 rounded-md border text-sm hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addMember}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
                disabled={
                  !draftName.trim() ||
                  !draftEmail.trim() ||
                  !draftPassword.trim()
                }
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
