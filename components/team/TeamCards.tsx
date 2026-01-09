"use client";
import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { useAuth, addUser } from "@/components/auth/AuthContext";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Phone,
  Linkedin,
  Github,
  Twitter,
  UserCircle2,
  Facebook,
  Instagram,
  Music2,
} from "lucide-react";
import { MemberForm } from "./MemberForm";
import { StatusPicker } from "./StatusPicker";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { getCountries, getStates, getCities } from "@/app/actions/geo";
import { Card } from "@/components/ui/Card";
import { getMemberActivity } from "@/lib/utils";
import { useRevalidatedData } from "@/hooks/useRevalidatedData";
import { loadUsers, User } from "@/lib/data";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToaster } from "@/components/ui/Toaster";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

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
  bio?: string;
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
  "Master Admin":
    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20 font-bold",
};

type TeamCardsProps = {
  onAddClick?: (fn: () => void) => void;
  onChatClick?: (memberName: string) => void;
};

export function TeamCards({ onAddClick, onChatClick }: TeamCardsProps) {
  const { currentUser, isAdmin, isMasterAdmin } = useAuth();
  const { show } = useToaster();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
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
      status: "offline",
      tasksCount: 0,
      statusMessage: u.statusMessage || u.status_message,
      statusEmoji: u.statusEmoji || u.status_emoji,
    }));
  }, [allUsers]);

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
  const [draftLinkedin, setDraftLinkedin] = useState("");
  const [draftGithub, setDraftGithub] = useState("");
  const [draftTwitter, setDraftTwitter] = useState("");
  const [draftFacebook, setDraftFacebook] = useState("");
  const [draftInstagram, setDraftInstagram] = useState("");
  const [draftTiktok, setDraftTiktok] = useState("");

  const [allCountries, setAllCountries] = useState<any[]>([]);
  const [allStates, setAllStates] = useState<any[]>([]);
  const [allCities, setAllCities] = useState<any[]>([]);

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

  useEffect(() => {
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
          const map: Record<string, { status: string; lastSeen: string }> = {};

          json.data.forEach((p: any) => {
            const lastSeen = new Date(p.lastSeen);
            const now = new Date();
            const diffMins = (now.getTime() - lastSeen.getTime()) / 60000;
            const isOnline = diffMins < 5;
            const status = isOnline ? p.status || "available" : "offline";

            activityMap.set(p.uid, { status, lastSeen });
            map[p.uid] = { status: p.status, lastSeen: p.lastSeen };
          });
          setMemberActivities(activityMap);
          setPresenceMap(map);
        }
      } catch (e) {
        console.error("Failed to fetch presence", e);
      }
    }

    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    return () => clearInterval(interval);
  }, [membersData]);

  useEffect(() => {
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
    setDraftAddress(member.rawAddress?.addressLine1 || "");
    setDraftAddress2(member.rawAddress?.addressLine2 || "");
    setDraftCity(member.rawAddress?.city || "");
    setDraftState(member.rawAddress?.state || "");
    setDraftCountry(member.rawAddress?.country || "");
    setDraftPostal(member.rawAddress?.postalCode || "");
    setDraftBio(member.bio || "");
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

    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        await fetchWithCsrf(`/api/users/${editMemberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });
      }
      refreshUsers();
      setEditOpen(false);
      show("success", "Member updated successfully");
    } catch (e) {
      console.error("Failed to save changes", e);
      show("error", "Failed to update member");
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

    try {
      const { shouldUseDatabaseData } = await import("@/lib/dataSource");
      if (shouldUseDatabaseData()) {
        const res = await fetchWithCsrf("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            password_hash: payload.password,
          }),
        });
        const json = await res.json();
        if (json.success) {
          addUser(json.data);
        }
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
      console.error("Failed to add member", e);
      show("error", "Failed to add member");
    }
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

  return (
    <div className="space-y-6 relative min-h-[400px]">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="p-5 border rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
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
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
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
                          const isOffline = Date.now() - last > 5 * 60 * 1000;
                          statusToUse = isOffline
                            ? "offline"
                            : p.status || "available";
                        } else if (memberActivities.get(m.id)) {
                          statusToUse =
                            memberActivities.get(m.id)?.status ||
                            memberActivities.get(m.id)?.currentStatus;
                        }
                        return (
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(statusToUse)}`}
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
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleColors[m.role] || "bg-secondary text-secondary-foreground"}`}
                    >
                      {m.role}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{m.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{m.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex gap-2">
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
                        <Linkedin className="w-4 h-4 text-blue-600 hover:scale-110 transition-transform" />
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
                        <Github className="w-4 h-4 text-foreground hover:scale-110 transition-transform" />
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(m);
                        }}
                        className="p-1.5 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
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
                        className="p-1.5 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-primary"
                        title="Set your status"
                      >
                        <span className="text-sm">{m.statusEmoji || "👋"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
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
          onSave={async (emoji, message) => {
            if (!currentUser) return;
            try {
              const res = await fetchWithCsrf(`/api/users/${currentUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  statusEmoji: emoji,
                  statusMessage: message,
                }),
              });
              if (res.ok) refreshUsers();
            } catch (e) {
              console.error("Failed to save status", e);
            }
          }}
          onClear={async () => {
            if (!currentUser) return;
            try {
              const res = await fetchWithCsrf(`/api/users/${currentUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  statusEmoji: "",
                  statusMessage: "",
                }),
              });
              if (res.ok) refreshUsers();
            } catch (e) {
              console.error("Failed to clear status", e);
            }
          }}
          onClose={() => setStatusOpen(false)}
        />
      )}
    </div>
  );
}
