"use client";
import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth, addUser } from "@/components/auth/AuthContext";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { useRevalidatedData } from "@/hooks/useRevalidatedData";
import { loadUsers, User } from "@/lib/data";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToaster } from "@/components/ui/Toaster";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Music2,
  UserCircle2,
  MoreVertical,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { MemberForm } from "./MemberForm";
import { StatusPicker } from "./StatusPicker";
import { Card } from "@/components/ui/Card";
import { getMemberActivity, updateMemberActivity } from "@/lib/utils";
import {
  getCountries,
  getStates,
  getCities,
  type GeoOption,
} from "@/app/actions/geo";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type Socials = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  socials: Socials;
  avatar: string;
  rawAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  bio?: string;
  isMasterAdmin?: boolean;
  statusMessage?: string;
  statusEmoji?: string;
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
  Admin: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  "Master Admin":
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-bold",
};

type TeamTableProps = {
  onAddClick?: (fn: () => void) => void;
  onChatClick?: (memberName: string) => void;
};

export function TeamTable({ onAddClick, onChatClick }: TeamTableProps) {
  const searchParams = useSearchParams();
  const { isAdmin, isMasterAdmin, currentUser } = useAuth();
  const { show } = useToaster();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const {
    data: allUsers,
    loading: isLoading,
    refresh: refreshUsers,
  } = useRevalidatedData<User[]>(loadUsers, { persistKey: "users" });

  const membersData = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.map((u: any) => ({
      id: u.uid || u.id,
      name: u.name,
      role: u.role || "Member",
      email: u.email,
      phone: u.phone || "+1 (555) 000-0000",
      address: u.address || "-",
      rawAddress: u.rawAddress || {},
      bio: u.bio || "",
      socials: u.socials || {},
      avatar:
        u.avatar_url ||
        u.avatarUrl ||
        u.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
      isMasterAdmin: u.isMasterAdmin || false,
      statusMessage: u.statusMessage || u.status_message,
      statusEmoji: u.statusEmoji || u.status_emoji,
    }));
  }, [allUsers]);

  const [memberActivities, setMemberActivities] = useState<Map<string, any>>(
    new Map()
  );

  const handleStatusSave = async (emoji: string, message: string) => {
    if (!currentUser) return;
    try {
      const res = await fetchWithCsrf(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusEmoji: emoji, statusMessage: message }),
      });
      if (res.ok) refreshUsers();
    } catch (e) {
      console.error("Failed to save status", e);
    }
  };

  const handleStatusClear = async () => {
    if (!currentUser) return;
    try {
      const res = await fetchWithCsrf(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusEmoji: "", statusMessage: "" }),
      });
      if (res.ok) refreshUsers();
    } catch (e) {
      console.error("Failed to clear status", e);
    }
  };

  useEffect(() => {
    const uid = searchParams.get("uid");
    if (uid && membersData.length > 0 && !editMemberId) {
      const member = membersData.find((m) => m.id === uid);
      if (member) openEdit(member);
    }
  }, [searchParams, membersData, editMemberId]);

  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftAddress2, setDraftAddress2] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftCountry, setDraftCountry] = useState("");
  const [draftState, setDraftState] = useState("");
  const [draftPostal, setDraftPostal] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftPassword, setDraftPassword] = useState("");
  const [draftLinkedin, setDraftLinkedin] = useState("");
  const [draftGithub, setDraftGithub] = useState("");
  const [draftTwitter, setDraftTwitter] = useState("");
  const [draftFacebook, setDraftFacebook] = useState("");
  const [draftInstagram, setDraftInstagram] = useState("");
  const [draftTiktok, setDraftTiktok] = useState("");

  const [allCountries, setAllCountries] = useState<GeoOption[]>([]);
  const [allStates, setAllStates] = useState<GeoOption[]>([]);
  const [allCities, setAllCities] = useState<GeoOption[]>([]);

  useEffect(() => {
    getCountries().then(setAllCountries);
  }, []);

  const currentCountryIso = useMemo(() => {
    return allCountries.find((c) => c.label === draftCountry)?.value;
  }, [allCountries, draftCountry]);

  useEffect(() => {
    if (!currentCountryIso) {
      setAllStates([]);
      return;
    }
    getStates(currentCountryIso).then(setAllStates);
  }, [currentCountryIso]);

  const currentStateIso = useMemo(() => {
    return allStates.find((s) => s.label === draftState)?.value;
  }, [allStates, draftState]);

  useEffect(() => {
    if (!currentCountryIso) {
      setAllCities([]);
      return;
    }
    getCities(currentCountryIso, currentStateIso).then(setAllCities);
  }, [currentCountryIso, currentStateIso]);

  React.useEffect(() => {
    async function fetchPresence() {
      try {
        const { shouldUseDatabaseData } = await import("@/lib/dataSource");
        if (!shouldUseDatabaseData()) {
          const activities = new Map();
          membersData.forEach((m) => {
            const act = getMemberActivity(m.name);
            activities.set(m.id, act);
          });
          setMemberActivities(activities);
          return;
        }
        const res = await fetch("/api/presence");
        const json = await res.json();
        if (json.success) {
          const activityMap = new Map();
          json.data.forEach((p: any) => {
            const lastSeen = new Date(p.lastSeen);
            const now = new Date();
            const diffMins = (now.getTime() - lastSeen.getTime()) / 60000;
            const isOnline = diffMins < 5;
            const status = isOnline ? p.status || "available" : "offline";
            activityMap.set(p.uid, { status, lastSeen });
          });
          setMemberActivities(activityMap);
        }
      } catch (e) {
        console.error("Failed to fetch presence", e);
      }
    }
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    return () => clearInterval(interval);
  }, [membersData]);

  React.useEffect(() => {
    if (isAdmin) {
      fetchWithCsrf("/api/maintenance/cleanup", { method: "POST" }).catch((e) =>
        console.error("Maintenance failed", e)
      );
    }
  }, [isAdmin]);

  React.useEffect(() => {
    if (onAddClick) {
      onAddClick(() => {
        resetDrafts();
        setAddOpen(true);
      });
    }
  }, [onAddClick]);

  const roles = useMemo(
    () => Array.from(new Set(membersData.map((m) => m.role))),
    [membersData]
  );

  const filtered = membersData.filter((m) => {
    const matchQ =
      q.trim().length === 0 ||
      [m.name, m.email, m.role, m.phone, m.address]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase());
    const matchR = role === "all" || m.role === role;
    return matchQ && matchR;
  });

  function toggleMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (menuOpen === id) {
      setMenuOpen(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right - 160 + window.scrollX,
      });
      setMenuOpen(id);
    }
  }

  function openEdit(member: TeamMember) {
    setEditMemberId(member.id);
    setDraftName(member.name);
    setDraftRole(member.role);
    setDraftEmail(member.email);
    setDraftPhone(member.phone);
    setDraftAddress(member.rawAddress?.addressLine1 || "");
    setDraftAddress2(member.rawAddress?.addressLine2 || "");
    setDraftCity(member.rawAddress?.city || "");
    setDraftState(member.rawAddress?.state || "");
    setDraftCountry(member.rawAddress?.country || "");
    setDraftPostal(member.rawAddress?.postalCode || "");
    setDraftBio(member.bio || "");
    setDraftLinkedin(member.socials?.linkedin || "");
    setDraftGithub(member.socials?.github || "");
    setDraftTwitter(member.socials?.twitter || "");
    setDraftFacebook(member.socials?.facebook || "");
    setDraftInstagram(member.socials?.instagram || "");
    setDraftTiktok(member.socials?.tiktok || "");
    setEditOpen(true);
    setMenuOpen(null);
  }

  async function saveEdit() {
    if (!editMemberId) return;
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      const updatedData = {
        name: draftName.trim(),
        role: draftRole.trim(),
        email: draftEmail.trim(),
        phone: draftPhone.trim(),
        addressLine1: draftAddress.trim(),
        addressLine2: draftAddress2.trim(),
        city: draftCity.trim(),
        state: draftState.trim(),
        country: draftCountry.trim(),
        postalCode: draftPostal.trim(),
        bio: draftBio.trim(),
        socials: {
          linkedin: draftLinkedin.trim(),
          github: draftGithub.trim(),
          twitter: draftTwitter.trim(),
          facebook: draftFacebook.trim(),
          instagram: draftInstagram.trim(),
          tiktok: draftTiktok.trim(),
        },
      };
      if (shouldUseDatabaseData()) {
        const res = await fetchWithCsrf(`/api/users/${editMemberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        if (!res.ok) throw new Error("Update failed");
      }
      setEditOpen(false);
      setEditMemberId(null);
      refreshUsers();
      show("success", "Member updated successfully");
    } catch (e) {
      console.error("Save failed", e);
      show("error", "Failed to update member");
    }
  }

  async function addMember() {
    if (!draftName.trim() || !draftEmail.trim() || !draftPassword.trim())
      return;
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      const payload = {
        name: draftName.trim(),
        email: draftEmail.trim(),
        role: draftRole.trim() || "Member",
        password: draftPassword.trim(),
        phone: draftPhone.trim(),
        bio: draftBio.trim(),
        addressLine1: draftAddress.trim(),
        addressLine2: draftAddress2.trim(),
        city: draftCity.trim(),
        state: draftState.trim(),
        country: draftCountry.trim(),
        postalCode: draftPostal.trim(),
        socials: {
          linkedin: draftLinkedin.trim(),
          github: draftGithub.trim(),
          twitter: draftTwitter.trim(),
          facebook: draftFacebook.trim(),
          instagram: draftInstagram.trim(),
          tiktok: draftTiktok.trim(),
        },
      };
      if (shouldUseDatabaseData()) {
        const res = await fetchWithCsrf("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, password_hash: payload.password }),
        });
        if (!res.ok) throw new Error("Failed to create user");
      } else {
        addUser({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          password: payload.password,
        });
      }
      setAddOpen(false);
      resetDrafts();
      refreshUsers();
      show("success", "Member added successfully");
    } catch (e) {
      console.error("Add failed", e);
      show("error", "Failed to add member");
    }
  }

  function resetDrafts() {
    setDraftName("");
    setDraftRole("");
    setDraftEmail("");
    setDraftPhone("");
    setDraftAddress("");
    setDraftAddress2("");
    setDraftCity("");
    setDraftState("");
    setDraftCountry("");
    setDraftPostal("");
    setDraftBio("");
    setDraftLinkedin("");
    setDraftGithub("");
    setDraftTwitter("");
    setDraftFacebook("");
    setDraftInstagram("");
    setDraftTiktok("");
    setDraftPassword("");
  }

  async function removeMember(id: string) {
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        const { shouldUseDatabaseData } = await import("@/lib/dataSource");
        if (shouldUseDatabaseData()) {
          const res = await fetchWithCsrf(`/api/users/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Delete failed");
        }
        refreshUsers();
        show("success", "Member removed successfully");
      } catch (e) {
        console.error("Delete failed", e);
        show("error", "Failed to remove member");
      }
    }
    setMenuOpen(null);
  }

  async function handleRoleChange(id: string, newRole: string) {
    if (newRole === "Master Admin") return;
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        await fetchWithCsrf(`/api/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
      }
      refreshUsers();
      show("success", `Role updated to ${newRole}`);
    } catch (e) {
      console.error("Failed to update role", e);
      show("error", "Failed to update role");
    }
  }

  const getStatusColor = (status?: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "online":
      case "available":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-orange-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="overflow-x-auto rounded-lg border border-border">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="flex bg-secondary/50 border-b border-border mb-2 p-2 rounded">
              <Skeleton className="h-6 w-full" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : (
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
                  Status
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
                  className="hover:bg-secondary/30 transition-colors group cursor-pointer"
                  onClick={() =>
                    onChatClick && currentUser?.id !== m.id && onChatClick(m.id)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={m.avatar}
                          alt={m.name}
                          className="w-10 h-10 rounded-full bg-accent ring-2 ring-accent/30"
                        />
                        {memberActivities.get(m.id) && (
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(memberActivities.get(m.id)?.status || memberActivities.get(m.id)?.currentStatus)}`}
                          />
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-sm block">
                          {m.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {m.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${roleColors[m.role] || "bg-secondary text-secondary-foreground"}`}
                      >
                        {m.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.statusEmoji && <span>{m.statusEmoji}</span>}
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {m.statusMessage || "No status"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {m.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-title">
                      <MapPin className="w-3.5 h-3.5" /> {m.address}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {m.socials?.linkedin && (
                        <a
                          href={
                            m.socials.linkedin.startsWith("http")
                              ? m.socials.linkedin
                              : `https://linkedin.com/in/${m.socials.linkedin}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-75 transition-opacity"
                        >
                          <Linkedin className="w-4 h-4 text-blue-600" />
                        </a>
                      )}
                      {m.socials?.github && (
                        <a
                          href={
                            m.socials.github.startsWith("http")
                              ? m.socials.github
                              : `https://github.com/${m.socials.github}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-75 transition-opacity"
                        >
                          <Github className="w-4 h-4 text-foreground" />
                        </a>
                      )}
                      {m.socials?.twitter && (
                        <a
                          href={
                            m.socials.twitter.startsWith("http")
                              ? m.socials.twitter
                              : `https://twitter.com/${m.socials.twitter}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-75 transition-opacity"
                        >
                          <Twitter className="w-4 h-4 text-sky-500" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(m);
                          }}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit member"
                        >
                          <UserCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {currentUser?.id === m.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusOpen(true);
                          }}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"
                          title="Set your status"
                        >
                          <span className="text-lg">
                            {m.statusEmoji || "👋"}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => toggleMenu(e, m.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Popovers & Modals */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(null)}
          />
          <div
            className="fixed z-50 w-48 bg-card border border-border rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {isAdmin && (
              <>
                <button
                  onClick={() => removeMember(menuOpen)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Remove Member
                </button>
                <div className="border-t border-border my-1" />
                <div className="px-4 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Change Role
                </div>
                {Object.keys(roleColors)
                  .filter((r) => r !== "Master Admin")
                  .map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(menuOpen, r)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      {r}
                    </button>
                  ))}
              </>
            )}
            {!isAdmin && (
              <div className="px-4 py-2 text-sm text-muted-foreground italic">
                No actions available
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={editOpen} onOpenChange={setEditOpen} size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">Edit Team Member</h3>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <MemberForm
            mode="edit"
            draftName={draftName}
            setDraftName={setDraftName}
            draftRole={draftRole}
            setDraftRole={setDraftRole}
            draftEmail={draftEmail}
            setDraftEmail={setDraftEmail}
            draftPhone={draftPhone}
            setDraftPhone={setDraftPhone}
            draftAddress={draftAddress}
            setDraftAddress={setDraftAddress}
            draftAddress2={draftAddress2}
            setDraftAddress2={setDraftAddress2}
            draftCity={draftCity}
            setDraftCity={setDraftCity}
            draftState={draftState}
            setDraftState={setDraftState}
            draftCountry={draftCountry}
            setDraftCountry={setDraftCountry}
            draftPostal={draftPostal}
            setDraftPostal={setDraftPostal}
            draftBio={draftBio}
            setDraftBio={setDraftBio}
            draftLinkedin={draftLinkedin}
            setDraftLinkedin={setDraftLinkedin}
            draftGithub={draftGithub}
            setDraftGithub={setDraftGithub}
            draftTwitter={draftTwitter}
            setDraftTwitter={setDraftTwitter}
            draftFacebook={draftFacebook}
            setDraftFacebook={setDraftFacebook}
            draftInstagram={draftInstagram}
            setDraftInstagram={setDraftInstagram}
            draftTiktok={draftTiktok}
            setDraftTiktok={setDraftTiktok}
            allCountries={allCountries}
            allStates={allStates}
            allCities={allCities}
            currentCountryIso={currentCountryIso || ""}
            currentStateIso={currentStateIso}
            roleColors={roleColors}
            isMasterAdmin={isMasterAdmin || false}
          />
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="primary" onClick={saveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={addOpen} onOpenChange={setAddOpen} size="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">Add New Member</h3>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
          <MemberForm
            mode="add"
            draftName={draftName}
            setDraftName={setDraftName}
            draftRole={draftRole}
            setDraftRole={setDraftRole}
            draftEmail={draftEmail}
            setDraftEmail={setDraftEmail}
            draftPassword={draftPassword}
            setDraftPassword={setDraftPassword}
            draftPhone={draftPhone}
            setDraftPhone={setDraftPhone}
            draftAddress={draftAddress}
            setDraftAddress={setDraftAddress}
            draftAddress2={draftAddress2}
            setDraftAddress2={setDraftAddress2}
            draftCity={draftCity}
            setDraftCity={setDraftCity}
            draftState={draftState}
            setDraftState={setDraftState}
            draftCountry={draftCountry}
            setDraftCountry={setDraftCountry}
            draftPostal={draftPostal}
            setDraftPostal={setDraftPostal}
            draftBio={draftBio}
            setDraftBio={setDraftBio}
            draftLinkedin={draftLinkedin}
            setDraftLinkedin={setDraftLinkedin}
            draftGithub={draftGithub}
            setDraftGithub={setDraftGithub}
            draftTwitter={draftTwitter}
            setDraftTwitter={setDraftTwitter}
            draftFacebook={draftFacebook}
            setDraftFacebook={setDraftFacebook}
            draftInstagram={draftInstagram}
            setDraftInstagram={setDraftInstagram}
            draftTiktok={draftTiktok}
            setDraftTiktok={setDraftTiktok}
            allCountries={allCountries}
            allStates={allStates}
            allCities={allCities}
            currentCountryIso={currentCountryIso || ""}
            currentStateIso={currentStateIso}
            roleColors={roleColors}
            isMasterAdmin={isMasterAdmin || false}
          />
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="primary" onClick={addMember}>
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {statusOpen && (
        <StatusPicker
          currentEmoji={currentUser?.statusEmoji}
          currentStatus={currentUser?.statusMessage}
          onSave={handleStatusSave}
          onClear={handleStatusClear}
          onClose={() => setStatusOpen(false)}
        />
      )}
    </div>
  );
}
