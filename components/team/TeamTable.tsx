"use client";
import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { useAuth, addUser } from "@/components/auth/AuthContext";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  Facebook,
  Instagram,
  Music2, // Using Music2 for TikTok
  UserCircle2,
  MoreVertical,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { MemberForm } from "./MemberForm";
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
  // Extended fields
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
};

// ENRICH constant removed as we now fetch real data
// If keeping for fallback, ensure it doesn't override real empty values if not desired.
// For now, removing to force real data usage.

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
  const { isAdmin, isMasterAdmin, currentUser } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  // Menu positioning state
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const [editOpen, setEditOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [membersData, setMembersData] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberActivities, setMemberActivities] = useState<Map<string, any>>(
    new Map()
  );

  // Add/Edit Form State
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

  // Geo State
  const [allCountries, setAllCountries] = useState<GeoOption[]>([]);
  const [allStates, setAllStates] = useState<GeoOption[]>([]);
  const [allCities, setAllCities] = useState<GeoOption[]>([]);

  // Load Countries
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

  const initialMembers: TeamMember[] = useMemo(() => {
    // Load users from auth system
    if (typeof window === "undefined") return [];

    // This will be loaded asynchronously below
    return [];
  }, []);

  // Initialize membersData once
  React.useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const { loadUsers } = await import("@/lib/data");
        const { shouldUseDatabaseData } = await import("@/lib/dataSource");

        let users = [];

        if (shouldUseDatabaseData()) {
          // Direct API fetch for live mode to ensure fresh data
          const res = await fetch("/api/users");
          const json = await res.json();
          if (json.success) {
            users = json.data;
          }
        } else {
          // Legacy mock loader
          users = await loadUsers();
        }

        const teamMembers = users.map((u: any) => ({
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
        }));

        setMembersData(teamMembers);
      } catch (error) {
        console.error("Failed to load team members:", error);
        setMembersData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Load member activities (REAL PRESENCE)
  React.useEffect(() => {
    async function fetchPresence() {
      try {
        const { shouldUseDatabaseData } = await import("@/lib/dataSource");
        if (!shouldUseDatabaseData()) {
          // Fallback to mock if using mock data
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
          // Map presence by UID (preferred) or Name if fallback needed
          // Using simple status interpretation
          json.data.forEach((p: any) => {
            // Check if online (seen in last 5 mins)
            const lastSeen = new Date(p.last_seen);
            const now = new Date();
            const diffMins = (now.getTime() - lastSeen.getTime()) / 60000;
            const isOnline = diffMins < 5; // Unified 5-minute threshold
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
    const interval = setInterval(fetchPresence, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [membersData]);

  // Perform 90-day cleanup once on mount for admins
  React.useEffect(() => {
    if (isAdmin) {
      fetchWithCsrf("/api/maintenance/cleanup", { method: "POST" }).catch((e) =>
        console.error("Maintenance failed", e)
      );
    }
  }, [isAdmin]);

  // Expose add function to parent
  React.useEffect(() => {
    if (onAddClick) {
      onAddClick(() => {
        resetDrafts();
        setAddOpen(true);
      });
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

  function toggleMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (menuOpen === id) {
      setMenuOpen(null);
    } else {
      // Calculate position based on button click
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 5,
        left: rect.right - 160 + window.scrollX, // -160 for approx width
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
        // Updated via API
        const res = await fetchWithCsrf(`/api/users/${editMemberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
        if (!res.ok) throw new Error("Update failed");
        const json = await res.json();
        // Could merge json.user here, but let's do optimistic update for speed
      }

      setMembersData((prev) =>
        prev.map((m) =>
          m.id === editMemberId
            ? {
                ...m,
                ...updatedData,
                address:
                  [updatedData.city, updatedData.country]
                    .filter(Boolean)
                    .join(", ") ||
                  updatedData.addressLine1 ||
                  m.address,
                rawAddress: {
                  addressLine1: updatedData.addressLine1,
                  addressLine2: updatedData.addressLine2,
                  city: updatedData.city,
                  state: updatedData.state,
                  country: updatedData.country,
                  postalCode: updatedData.postalCode,
                },
                bio: updatedData.bio,
                socials: updatedData.socials,
                avatar:
                  m.avatar && !m.avatar.includes("dicebear.com")
                    ? m.avatar
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(updatedData.name || m.name)}`,
              }
            : m
        )
      );
      setEditOpen(false);
      setEditMemberId(null);
    } catch (e) {
      console.error("Save failed", e);
      // Add toast notification later
    }
  }

  async function addMember() {
    if (!draftName.trim() || !draftEmail.trim() || !draftPassword.trim())
      return;

    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      const { fetchWithCsrf } = await import("@/lib/csrf-client");

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

      let newMember: TeamMember;

      if (shouldUseDatabaseData()) {
        const res = await fetchWithCsrf("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            password_hash: payload.password, // The API handles hashing
          }),
        });
        if (!res.ok) throw new Error("Failed to create user");
        const json = await res.json();
        const u = json.user;
        newMember = {
          id: u.uid || u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          phone: u.phone || "+1 (555) 000-0000",
          address:
            [u.city, u.country].filter(Boolean).join(", ") ||
            u.addressLine1 ||
            "-",
          rawAddress: {
            addressLine1: u.addressLine1,
            addressLine2: u.addressLine2,
            city: u.city,
            state: u.state,
            country: u.country,
            postalCode: u.postalCode,
          },
          bio: u.bio,
          socials: u.socials || {},
          avatar:
            u.avatar_url ||
            u.avatarUrl ||
            u.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
        };
      } else {
        // Fallback legacy (local state only)
        const newUser = addUser({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          password: payload.password,
        });

        newMember = {
          id: newUser.id,
          name: newUser.name,
          role: newUser.role,
          email: newUser.email,
          phone: payload.phone || "+1 (555) 000-0000",
          address:
            [payload.city, payload.country].filter(Boolean).join(", ") ||
            payload.addressLine1 ||
            "-",
          rawAddress: {
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            postalCode: payload.postalCode,
          },
          bio: payload.bio,
          socials: payload.socials,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newUser.name)}`,
        };
      }

      setMembersData((prev) => [...prev, newMember]);
      setAddOpen(false);
      resetDrafts();
    } catch (e) {
      console.error("Add failed", e);
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
    setDraftLinkedin("");
    setDraftGithub("");
    setDraftTwitter("");
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

  async function handleRoleChange(id: string, newRole: string) {
    if (newRole === "Master Admin") return; // Safety check

    setMembersData((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          if (m.isMasterAdmin) return m; // Prevent changing Master Admin role
          return { ...m, role: newRole };
        }
        return m;
      })
    );

    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        await fetchWithCsrf(`/api/users/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
      }
    } catch (e) {
      console.error("Failed to update role", e);
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-[400px]">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center space-y-1">
              <span className="text-lg font-semibold text-foreground block">
                Fetching Team Directory
              </span>
              <span className="text-sm text-muted-foreground animate-pulse">
                Please wait while we synchronize with the database...
              </span>
            </div>
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
                        {(memberActivities.get(m.id)?.status === "online" ||
                          memberActivities.get(m.id)?.status === "available" ||
                          memberActivities.get(m.id)?.currentStatus ===
                            "online" ||
                          memberActivities.get(m.id)?.currentStatus ===
                            "available") && (
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
                        disabled={m.isMasterAdmin}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer disabled:cursor-not-allowed ${roleColors[m.role] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"}`}
                      >
                        {Object.keys(roleColors).map((r) => (
                          <option
                            key={r}
                            value={r}
                            disabled={r === "Master Admin" && !m.isMasterAdmin}
                          >
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

                  <td className="px-4 py-3">
                    {m.socials.linkedin ||
                    m.socials.github ||
                    m.socials.twitter ||
                    m.socials.facebook ||
                    m.socials.instagram ||
                    m.socials.tiktok ? (
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
                        {m.socials.facebook && (
                          <a
                            href={`https://facebook.com/${m.socials.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-500 transition-colors cursor-pointer"
                            title="Facebook"
                          >
                            <Facebook className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {m.socials.instagram && (
                          <a
                            href={`https://instagram.com/${m.socials.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 transition-colors cursor-pointer"
                            title="Instagram"
                          >
                            <Instagram className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {m.socials.tiktok && (
                          <a
                            href={`https://tiktok.com/@${m.socials.tiktok}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 dark:text-slate-100 transition-colors cursor-pointer"
                            title="TikTok"
                          >
                            <Music2 className="w-3.5 h-3.5" />
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
                      {onChatClick && currentUser?.id !== m.id && (
                        <button
                          onClick={() => onChatClick(m.id)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            memberActivities.get(m.id)?.currentStatus ===
                            "online"
                              ? "hover:bg-green-500/10 text-green-600 dark:text-green-400"
                              : "hover:bg-secondary text-muted-foreground"
                          }`}
                          title={
                            memberActivities.get(m.id)?.currentStatus ===
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
                          onClick={(e) => toggleMenu(e, m.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}

                      {/* Fixed Position Menu - outside overflow container */}
                      {menuOpen === m.id && isAdmin && (
                        <div
                          className="fixed z-50 bg-popover border rounded-lg shadow-md min-w-40 text-sm animate-fadeIn"
                          style={{ top: menuPos.top, left: menuPos.left }}
                        >
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
        )}
      </div>

      {/* Remove previous inline menu (deleted by replacement overlap) */}

      {/* Empty State */}
      {!isLoading && filtered.length === 0 && (
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
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-xl shadow-lg p-6 w-full max-w-xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-6">Edit Member</h3>
            <div className="overflow-y-auto pr-2 grow scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30 transition-colors">
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
                draftFacebook={draftFacebook}
                setDraftFacebook={setDraftFacebook}
                draftInstagram={draftInstagram}
                setDraftInstagram={setDraftInstagram}
                draftTiktok={draftTiktok}
                setDraftTiktok={setDraftTiktok}
                draftGithub={draftGithub}
                setDraftGithub={setDraftGithub}
                draftTwitter={draftTwitter}
                setDraftTwitter={setDraftTwitter}
                allCountries={allCountries}
                allStates={allStates}
                allCities={allCities}
                currentCountryIso={currentCountryIso || ""}
                currentStateIso={currentStateIso || ""}
                roleColors={roleColors}
                isMasterAdmin={isMasterAdmin}
              />
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
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border rounded-xl shadow-lg p-6 w-full max-w-xl max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-6">Add New Member</h3>
            <div className="overflow-y-auto pr-2 grow scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground/30 transition-colors">
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
                draftFacebook={draftFacebook}
                setDraftFacebook={setDraftFacebook}
                draftInstagram={draftInstagram}
                setDraftInstagram={setDraftInstagram}
                draftTiktok={draftTiktok}
                setDraftTiktok={setDraftTiktok}
                draftGithub={draftGithub}
                setDraftGithub={setDraftGithub}
                draftTwitter={draftTwitter}
                setDraftTwitter={setDraftTwitter}
                allCountries={allCountries}
                allStates={allStates}
                allCities={allCities}
                currentCountryIso={currentCountryIso || ""}
                currentStateIso={currentStateIso || ""}
                roleColors={roleColors}
                isMasterAdmin={isMasterAdmin}
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t mt-auto">
              <button
                onClick={() => {
                  setAddOpen(false);
                  resetDrafts();
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
