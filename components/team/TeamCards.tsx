"use client";
import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
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
  Clock,
  CheckCircle2,
  MessageCircle,
  Loader2,
  Plus,
  Facebook,
  Instagram,
  Music2,
} from "lucide-react";
import { MemberForm } from "./MemberForm";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { getCountries, getStates, getCities } from "@/app/actions/geo";
import { addUser } from "@/components/auth/AuthContext";
import { PageLoader } from "@/components/ui/PageLoader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getMemberActivity, updateMemberActivity } from "@/lib/utils";
import { StatusPicker } from "./StatusPicker";

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
  status?: "available" | "busy" | "offline" | "online" | "away";
  tasksCount?: number;
  rawAddress?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
};

const ENRICH: Record<string, Partial<TeamMember>> = {
  u1: {
    phone: "+1 (555) 010-1010",
    address: "NY, USA",
    socials: { linkedin: "alice" },
    status: "available",
    tasksCount: 8,
  },
  u2: {
    phone: "+213 555 123 456",
    address: "Algeria",
    socials: { github: "anisdzed" },
    status: "available",
    tasksCount: 5,
  },
  u3: {
    phone: "+1 (555) 010-2020",
    address: "SF, USA",
    socials: { github: "bob-dev" },
    status: "busy",
    tasksCount: 12,
  },
  u4: {
    phone: "+44 20 7946 0123",
    address: "London, UK",
    socials: { twitter: "carol_design" },
    status: "available",
    tasksCount: 6,
  },
  u5: {
    phone: "+971 4 123 4567",
    address: "Dubai, UAE",
    socials: { linkedin: "david-b" },
    status: "offline",
    tasksCount: 4,
  },
  u6: {
    phone: "+61 2 9012 3456",
    address: "Sydney, AU",
    socials: { github: "eveops" },
    status: "available",
    tasksCount: 9,
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
  "Master Admin":
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-bold",
};

type TeamCardsProps = {
  onAddClick?: (fn: () => void) => void;
  onChatClick?: (memberName: string) => void;
};

export function TeamCards({ onAddClick, onChatClick }: TeamCardsProps) {
  const { currentUser, isAdmin, isMasterAdmin } = useAuth();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [membersData, setMembersData] = useState<TeamMember[]>([]);
  const [memberActivities, setMemberActivities] = useState<Map<string, any>>(
    new Map()
  );
  const [presenceMap, setPresenceMap] = useState<
    Record<string, { status: string; lastSeen: string }>
  >({});
  const [addOpen, setAddOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAddress, setDraftAddress] = useState("");
  const [draftAddress2, setDraftAddress2] = useState("");
  const [draftPassword, setDraftPassword] = useState("");
  const [draftBio, setDraftBio] = useState("");
  const [draftCountry, setDraftCountry] = useState("");
  const [draftState, setDraftState] = useState("");
  const [draftCity, setDraftCity] = useState("");
  const [draftPostal, setDraftPostal] = useState("");
  // Social states
  const [draftLinkedin, setDraftLinkedin] = useState("");
  const [draftGithub, setDraftGithub] = useState("");
  const [draftTwitter, setDraftTwitter] = useState("");
  const [draftFacebook, setDraftFacebook] = useState("");
  const [draftInstagram, setDraftInstagram] = useState("");
  const [draftTiktok, setDraftTiktok] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [allStates, setAllStates] = useState<any[]>([]);
  const [allCities, setAllCities] = useState<any[]>([]);
  const [statusPickerOpen, setStatusPickerOpen] = useState<string | null>(null);

  // Load geo data
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
          const res = await fetch("/api/users");
          const json = await res.json();
          if (json.success) users = json.data;
        } else {
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
          socials: u.socials || {},
          bio: u.bio || "",
          avatar:
            u.avatar_url ||
            u.avatarUrl ||
            u.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
          status: "available", // Presence logic handles this
          tasksCount: 0,
          isMasterAdmin: u.role === "Master Admin",
          statusMessage: u.statusMessage || u.status_message,
          statusEmoji: u.statusEmoji || u.status_emoji,
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

  // Poll presence from server and build a map by uid
  React.useEffect(() => {
    let mounted = true;
    const loadPresence = async () => {
      try {
        const res = await fetch("/api/presence");
        const data = await res.json();
        if (mounted && data?.success && Array.isArray(data.data)) {
          const map: Record<string, { status: string; lastSeen: string }> = {};
          for (const row of data.data) {
            map[row.uid] = { status: row.status, lastSeen: row.lastSeen };
          }
          setPresenceMap(map);
        }
      } catch {}
    };
    loadPresence();
    const interval = setInterval(loadPresence, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
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

  function toggleMenu(id: string) {
    setMenuOpen(menuOpen === id ? null : id);
  }

  function resetDrafts() {
    setDraftName("");
    setDraftRole("");
    setDraftEmail("");
    setDraftPhone("");
    setDraftAddress("");
    setDraftAddress2("");
    setDraftPassword("");
    setDraftBio("");
    setDraftCountry("");
    setDraftState("");
    setDraftCity("");
    setDraftPostal("");
    setDraftLinkedin("");
    setDraftFacebook("");
    setDraftInstagram("");
    setDraftTiktok("");
    setDraftGithub("");
    setDraftTwitter("");
  }

  function openEdit(member: any) {
    setEditMemberId(member.id);
    setDraftName(member.name);
    setDraftRole(member.role);
    setDraftEmail(member.email);
    setDraftPhone(member.phone);
    setDraftPhone(member.phone);
    setDraftAddress(member.rawAddress?.addressLine1 || "");
    setDraftAddress2(member.rawAddress?.addressLine2 || "");
    setDraftCity(member.rawAddress?.city || "");
    setDraftState(member.rawAddress?.state || "");
    setDraftCountry(member.rawAddress?.country || "");
    setDraftPostal(member.rawAddress?.postalCode || "");
    setDraftBio(member.bio || "");
    // Socials
    if (member.socials) {
      setDraftLinkedin(member.socials.linkedin || "");
      setDraftFacebook(member.socials.facebook || "");
      setDraftInstagram(member.socials.instagram || "");
      setDraftTiktok(member.socials.tiktok || "");
      setDraftGithub(member.socials.github || "");
      setDraftTwitter(member.socials.twitter || "");
    }
    setEditOpen(true);
    setMenuOpen(null);
  }

  async function saveEdit() {
    if (!editMemberId) return;
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
        facebook: draftFacebook.trim(),
        instagram: draftInstagram.trim(),
        tiktok: draftTiktok.trim(),
        github: draftGithub.trim(),
        twitter: draftTwitter.trim(),
      },
    };

    // Optimistic Update
    setMembersData((prev) =>
      prev.map((m) =>
        m.id === editMemberId
          ? {
              ...m,
              ...updatedData,
              // Derive display string from components or fallback to line 1
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
              avatar:
                m.avatar && !m.avatar.includes("dicebear.com")
                  ? m.avatar
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      updatedData.name || m.name
                    )}`,
            }
          : m
      )
    );

    setEditOpen(false);
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        await fetchWithCsrf(`/api/users/${editMemberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
      }
    } catch (e) {
      console.error("Failed to save changes", e);
    }
  }

  async function addMember() {
    const payload = {
      name: draftName.trim(),
      role: draftRole.trim() || "Member",
      email: draftEmail.trim(),
      password: draftPassword.trim(),
      phone: draftPhone.trim(),
      address: draftAddress.trim(),
      bio: draftBio.trim(),
      socials: {
        linkedin: draftLinkedin.trim(),
        facebook: draftFacebook.trim(),
        instagram: draftInstagram.trim(),
        tiktok: draftTiktok.trim(),
        github: draftGithub.trim(),
        twitter: draftTwitter.trim(),
      },
    };

    setAddOpen(false);
    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        const res = await fetchWithCsrf("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            password_hash: payload.password, // The API handles hashing
          }),
        });
        const json = await res.json();
        if (json.success) {
          const u = json.data;
          const newM = {
            id: u.id,
            ...payload,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
            status: "offline" as const,
            tasksCount: 0,
          };
          setMembersData((prev) => [...prev, newM]);
          addUser(u);
        }
      } else {
        // Mock fallback
        const mockM = {
          id: `u${Date.now()}`,
          ...payload,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.name)}`,
          status: "available" as const,
          tasksCount: 0,
        };
        setMembersData((prev) => [...prev, mockM]);
      }
      resetDrafts();
    } catch (e) {
      console.error("Failed to add member", e);
    }
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
    const s = status?.toLowerCase();
    switch (s) {
      case "available":
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-orange-500";
      case "away":
        return "bg-yellow-500";
      case "offline":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getActivityStatusColor = (status?: string) => {
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

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "busy":
        return "Busy";
      case "offline":
        return "Offline";
      default:
        return "Unknown";
    }
  };

  const handleStatusSave = async (
    memberId: string,
    emoji: string,
    message: string
  ) => {
    try {
      // Optimistic update
      setMembersData((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, statusEmoji: emoji, statusMessage: message }
            : m
        )
      );

      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        const response = await fetchWithCsrf(`/api/users/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusEmoji: emoji, statusMessage: message }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to save status:", errorData);
          throw new Error(errorData.error || "Failed to save status");
        }

        console.log("Status saved successfully for user:", memberId);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      // Revert optimistic update on error
      setMembersData((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, statusEmoji: undefined, statusMessage: undefined }
            : m
        )
      );
    }
  };

  const handleStatusClear = async (memberId: string) => {
    try {
      // Optimistic update
      setMembersData((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? { ...m, statusEmoji: undefined, statusMessage: undefined }
            : m
        )
      );

      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        const response = await fetchWithCsrf(`/api/users/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusEmoji: "", statusMessage: "" }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to clear status:", errorData);
          throw new Error(errorData.error || "Failed to clear status");
        }

        console.log("Status cleared successfully for user:", memberId);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div className="space-y-6 relative min-h-[400px]">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3 min-h-[400px] border border-dashed rounded-xl bg-accent/20">
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
        <>
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

          {/* Team Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <Card
                key={m.id}
                className="p-5 hover:shadow-lg transition-all duration-300 group border hover:border-primary/50 relative overflow-hidden cursor-pointer"
                onClick={() => {
                  if (onChatClick && m.id !== currentUser?.id) {
                    onChatClick(m.id);
                  }
                }}
              >
                {/* Status indicator */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header with menu */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-14 h-14 rounded-full bg-accent ring-2 ring-accent/30 group-hover:ring-primary/30 transition-all"
                      />
                      {(() => {
                        const p = presenceMap[m.id];
                        let statusToUse: any = m.status;

                        if (p) {
                          const last = new Date(p.lastSeen).getTime();
                          const isOffline = Date.now() - last > 5 * 60 * 1000; // 5 minute threshold matches Table
                          statusToUse = isOffline
                            ? "offline"
                            : p.status || "available";
                        } else if (memberActivities.get(m.id)) {
                          statusToUse =
                            memberActivities.get(m.id)?.status ||
                            memberActivities.get(m.id)?.currentStatus;
                        } else if (memberActivities.get(m.name)) {
                          statusToUse =
                            memberActivities.get(m.name)?.status ||
                            memberActivities.get(m.name)?.currentStatus;
                        }

                        const dotClass = getStatusColor(statusToUse);
                        return (
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${dotClass}`}
                          />
                        );
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {m.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const p = presenceMap[m.id];
                          if (p) {
                            const last = new Date(p.lastSeen).getTime();
                            const offline = Date.now() - last > 5 * 60 * 1000;
                            if (offline) return "Offline";
                            if (p.status === "available") return "Available";
                            if (p.status === "busy") return "Busy";
                          }
                          const a = memberActivities.get(m.name)?.currentStatus;
                          if (a === "online") return "Active now";
                          if (a === "away") return "Away";
                          return getStatusLabel(m.status);
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onChatClick && m.id !== currentUser?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onChatClick(m.id);
                        }}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          memberActivities.get(m.id)?.currentStatus === "online"
                            ? "hover:bg-green-500/10 text-green-600 dark:text-green-400"
                            : "hover:bg-secondary text-muted-foreground"
                        }`}
                        title={
                          memberActivities.get(m.id)?.currentStatus === "online"
                            ? "Start chat (online)"
                            : "Start chat"
                        }
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="p-1.5 rounded hover:bg-accent transition-colors cursor-pointer"
                        title="More options"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(m.id);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {menuOpen === m.id && isAdmin && (
                  <div className="absolute right-4 top-12 z-10 bg-popover border rounded-lg shadow-md min-w-40 text-sm animate-fadeIn">
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

                {/* Role Badge */}
                <div className="mb-4">
                  {isMasterAdmin && m.role !== "Master Admin" ? (
                    <select
                      value={m.role}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                        roleColors[m.role] ||
                        "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {Object.keys(roleColors).map((r) => (
                        <option
                          key={r}
                          value={r}
                          disabled={
                            r === "Master Admin" && m.role !== "Master Admin"
                          }
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                        roleColors[m.role] ||
                        "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
                      }`}
                    >
                      {m.role}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {m.tasksCount} tasks
                    </span>
                  </div>
                  {(m as any).statusMessage ? (
                    <div
                      className="flex items-center gap-1.5 cursor-pointer hover:bg-accent/50 px-2 py-1 rounded transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (m.id === currentUser?.id || isAdmin) {
                          setStatusPickerOpen(m.id);
                        }
                      }}
                      title={
                        m.id === currentUser?.id || isAdmin
                          ? "Click to change status"
                          : ""
                      }
                    >
                      <span className="text-sm">
                        {(m as any).statusEmoji || "💬"}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {(m as any).statusMessage}
                      </span>
                    </div>
                  ) : (
                    (m.id === currentUser?.id || isAdmin) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStatusPickerOpen(m.id);
                        }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent/50"
                      >
                        <span>💬</span>
                        <span>Set status</span>
                      </button>
                    )
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <a
                      href={`mailto:${m.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-primary transition-colors truncate"
                    >
                      {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <a
                      href={`tel:${m.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-primary transition-colors truncate"
                    >
                      {m.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{m.address}</span>
                  </div>
                </div>

                {/* Social Links */}
                {(m.socials.linkedin ||
                  m.socials.facebook ||
                  m.socials.instagram ||
                  m.socials.tiktok ||
                  m.socials.github ||
                  m.socials.twitter) && (
                  <div className="pt-3 border-t border-border flex flex-wrap items-center gap-1.5">
                    {m.socials.linkedin && (
                      <a
                        href={`https://linkedin.com/in/${m.socials.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
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
                        onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 transition-colors cursor-pointer"
                        title="Twitter/X"
                      >
                        <Twitter className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

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
                currentCountryIso={currentCountryIso}
                currentStateIso={currentStateIso}
                roleColors={roleColors}
                isMasterAdmin={isMasterAdmin}
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t mt-auto">
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
              resetDrafts();
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
                currentCountryIso={currentCountryIso}
                currentStateIso={currentStateIso}
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
                disabled={!draftName.trim() || !draftEmail.trim()}
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Picker Modal */}
      {statusPickerOpen &&
        (() => {
          const member = membersData.find((m) => m.id === statusPickerOpen);
          return member ? (
            <StatusPicker
              currentStatus={(member as any).statusMessage}
              currentEmoji={(member as any).statusEmoji}
              onSave={(emoji, message) =>
                handleStatusSave(member.id, emoji, message)
              }
              onClear={() => handleStatusClear(member.id)}
              onClose={() => setStatusPickerOpen(null)}
            />
          ) : null;
        })()}
    </div>
  );
}
