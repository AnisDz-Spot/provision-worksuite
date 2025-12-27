"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/settings/SettingsProvider";
import { useAuth } from "@/components/auth/AuthContext";
import type { UserSettingsData } from "@/lib/settings";
import { shouldUseDatabaseData } from "@/lib/dataSource";
import {
  getCountries,
  getStates,
  getCities,
  type GeoOption,
} from "@/app/actions/geo";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { RefreshCw } from "lucide-react";

const DICEBEAR_STYLES = [
  { label: "Avatars", value: "avataaars" },
  { label: "Robots", value: "bottts" },
  { label: "Pixel Art", value: "pixel-art" },
  { label: "Lorelei", value: "lorelei" },
  { label: "Mini Avs", value: "miniavs" },
  { label: "Notionists", value: "notionists" },
  { label: "Adventurer", value: "adventurer" },
  { label: "Initials", value: "initials" },
];

export function UserProfileSettings() {
  const { user, updateUser } = useSettings();
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const [form, setForm] = useState<UserSettingsData>(user);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [imgError, setImgError] = useState(false);
  const [diceStyle, setDiceStyle] = useState("avataaars");
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState<string | null>(
    null
  );

  // Load style from current avatar if it's a dicebear one
  useEffect(() => {
    if (user.avatarDataUrl?.includes("api.dicebear.com")) {
      const match = user.avatarDataUrl.match(/\/7\.x\/([^/]+)\//);
      if (match) setDiceStyle(match[1]);
    }
  }, [user.avatarDataUrl]);

  // Async Options State
  const [allCountries, setAllCountries] = useState<GeoOption[]>([]);
  const [allStates, setAllStates] = useState<GeoOption[]>([]);
  const [allCities, setAllCities] = useState<GeoOption[]>([]);

  // Load Countries on mount
  useEffect(() => {
    getCountries().then(setAllCountries);
  }, []);

  const currentCountryIso = useMemo(() => {
    return allCountries.find((c) => c.label === form.country)?.value;
  }, [allCountries, form.country]);

  // Load States when country ISO changes
  useEffect(() => {
    if (!currentCountryIso) {
      setAllStates([]);
      return;
    }
    getStates(currentCountryIso).then(setAllStates);
  }, [currentCountryIso]);

  const currentStateIso = useMemo(() => {
    return allStates.find((s) => s.label === form.state)?.value;
  }, [allStates, form.state]);

  // Load Cities when State ISO changes (or Country if no state as fallback)
  useEffect(() => {
    if (!currentCountryIso) {
      setAllCities([]);
      return;
    }
    // We pass both country and state to getCities. State is preferred for accuracy.
    getCities(currentCountryIso, currentStateIso).then(setAllCities);
  }, [currentCountryIso, currentStateIso]);

  // Sync incoming context user if form not modified yet
  useEffect(() => {
    if (!dirty) {
      setForm(user);
    }
  }, [user, dirty]);

  // 🚀 SYNC: Fetch real user data from database on mount if using real mode
  useEffect(() => {
    if (shouldUseDatabaseData() && currentUser?.id) {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`/api/users/${currentUser.id}`);

          if (res.status === 401) {
            logout();
            window.location.href = "/auth/login";
            return;
          }

          const data = await res.json();
          if (data?.success && data?.user) {
            const dbUser = data.user;
            setUploadedAvatarUrl(dbUser.uploaded_avatar_url || null);
            const updatedForm: UserSettingsData = {
              fullName: dbUser.name || "",
              email: dbUser.email || "",
              phone: dbUser.phone || "",
              bio: dbUser.bio || "",
              addressLine1: dbUser.addressLine1 || "",
              addressLine2: dbUser.addressLine2 || "",
              city: dbUser.city || "",
              state: dbUser.state || "",
              country: dbUser.country || "",
              postalCode: dbUser.postalCode || "",
              role: dbUser.role || "Member",
              avatarDataUrl: dbUser.avatar_url || "",
            };
            setForm(updatedForm);
            // Also sync the settings context so other components (navbar) update
            updateUser(updatedForm, { silent: true });
          }
        } catch (e: any) {
          console.error("Failed to sync profile with database", e);
        }
      };
      fetchProfile();
    }
  }, [currentUser?.id, updateUser]); // Only fetch when ID is available

  function update<K extends keyof UserSettingsData>(
    key: K,
    value: UserSettingsData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("avatarDataUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleDiceBearGenerate(style?: string) {
    const s = style || diceStyle;
    const seed = Math.random().toString(36).substring(7);
    const url = `https://api.dicebear.com/7.x/${s}/svg?seed=${seed}`;
    update("avatarDataUrl", url);
    setImgError(false);
  }

  function handleRestoreAvatar() {
    if (uploadedAvatarUrl) {
      update("avatarDataUrl", uploadedAvatarUrl);
      setImgError(false);
    }
  }

  async function handleSave() {
    setProfileError("");
    setSaving(true);
    let avatarUrlToSet: string | undefined = undefined;

    try {
      // If database is configured and a user is logged in, persist to DB
      if (shouldUseDatabaseData() && currentUser) {
        if (form.avatarDataUrl && form.avatarDataUrl.startsWith("data:")) {
          try {
            // Convert data URL to Blob and upload to blob storage via existing endpoint
            const res = await fetch(form.avatarDataUrl);
            const blob = await res.blob();
            const uniqueFilename = `avatar-${currentUser.id}-${Date.now()}.png`;
            const fd = new FormData();
            fd.append(
              "file",
              new File([blob], uniqueFilename, {
                type: blob.type || "image/png",
              })
            );
            const upload = await fetch(
              `/api/setup/upload-avatar?filename=${encodeURIComponent(uniqueFilename)}`,
              {
                method: "POST",
                body: fd,
              }
            );
            const upData = await upload.json();
            if (upData?.success && upData?.url) {
              avatarUrlToSet = upData.url as string;
            } else {
              throw new Error(upData?.error || "Avatar upload failed");
            }
          } catch (e: any) {
            console.error("Avatar upload failed:", e);
            setProfileError(`Failed to upload avatar: ${e.message}`);
            setSaving(false);
            return;
          }
        }

        const payload: any = {
          name: form.fullName,
          email: form.email,
          phone: form.phone,
          bio: form.bio,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          state: form.state,
          country: form.country,
          postalCode: form.postalCode,
        };
        // Note: Role is not updated here to prevent privilege escalation
        if (avatarUrlToSet) {
          payload.avatar_url = avatarUrlToSet;
        } else if (
          form.avatarDataUrl &&
          !form.avatarDataUrl.startsWith("data:")
        ) {
          // If we have an avatar URL and it's NOT a data URI (e.g. dicebear or existing blob), send it
          payload.avatar_url = form.avatarDataUrl;
        }

        if (uploadedAvatarUrl && form.avatarDataUrl === uploadedAvatarUrl) {
          payload.uploaded_avatar_url = uploadedAvatarUrl;
        }

        const resp = await fetchWithCsrf(`/api/users/${currentUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.success) {
          throw new Error(
            data?.error || "Failed to update profile in database"
          );
        }
      }

      // 1. Update form with the REAL url if we uploaded one
      if (avatarUrlToSet) {
        setUploadedAvatarUrl(avatarUrlToSet);
        update("avatarDataUrl", avatarUrlToSet);
      }

      // Always persist UI settings locally
      const finalFormState = {
        ...form,
        avatarDataUrl: avatarUrlToSet || form.avatarDataUrl,
      };
      updateUser(finalFormState);
      setDirty(false);

      // Sync with Auth Context (Header/Session) in ALL modes
      updateCurrentUser({
        name: form.fullName,
        email: form.email,
        avatarUrl: finalFormState.avatarDataUrl,
      });
    } catch (e: any) {
      console.error("Profile save error:", e);
      if (e.message?.includes("Unauthorized") || e.message?.includes("401")) {
        logout(); // Auto-disconnect on invalid token
        window.location.href = "/auth/login";
        return;
      }
      setProfileError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-linear-to-br from-background to-secondary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold font-display">
          User Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and presence.
        </p>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex flex-col md:flex-row gap-8 items-center bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-secondary border-2 border-primary/20 flex items-center justify-center overflow-hidden shadow-2xl transition-transform hover:scale-105 duration-300">
                  {form.avatarDataUrl && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.avatarDataUrl}
                      alt="Avatar"
                      className="object-cover w-full h-full"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <span className="text-4xl font-bold bg-linear-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                      {form.fullName
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-all border-2 border-background">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <RefreshCw className="w-5 h-5" />
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 transition-all"
                onClick={() => handleDiceBearGenerate()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Randomize
              </Button>
              {uploadedAvatarUrl &&
                form.avatarDataUrl !== uploadedAvatarUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10 transition-all text-xs"
                    onClick={handleRestoreAvatar}
                  >
                    <RefreshCw className="w-3 h-3 mr-2 rotate-180" />
                    Restore Uploaded
                  </Button>
                )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Choose Style
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase">
                  DiceBear 7.x
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DICEBEAR_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setDiceStyle(s.value);
                      handleDiceBearGenerate(s.value);
                    }}
                    className={cn(
                      "group relative p-2 rounded-xl border text-left transition-all hover:shadow-md",
                      diceStyle === s.value
                        ? "bg-primary/10 border-primary shadow-sm"
                        : "bg-background/40 border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-[13px] font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate">
                      {s.label}
                    </div>
                    {/* Tiny Preview Icon logic could go here, but style text is safer for now */}
                    <div
                      className={cn(
                        "mt-1 h-1 rounded-full transition-all duration-300",
                        diceStyle === s.value
                          ? "w-full bg-primary"
                          : "w-0 bg-primary/30"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card/30 backdrop-blur-sm p-6 rounded-2xl border border-border/50">
          <div>
            <label className="text-xs font-medium mb-1 block">Full Name</label>
            <Input
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1 555 123 4567"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">
              Role (Read Only)
            </label>
            <Input
              value={form.role || "Member"}
              disabled
              className="bg-muted text-muted-foreground"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium mb-1 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={3}
              placeholder="Short bio about you..."
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Address Section */}
          <div className="md:col-span-2 border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-3">Address Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-medium mb-1 block">
                  Address Line 1
                </label>
                <Input
                  value={form.addressLine1}
                  onChange={(e) => update("addressLine1", e.target.value)}
                  placeholder="Street address, P.O. box, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium mb-1 block">
                  Address Line 2
                </label>
                <Input
                  value={form.addressLine2}
                  onChange={(e) => update("addressLine2", e.target.value)}
                  placeholder="Apartment, suite, unit, etc."
                />
              </div>
              {/* Reordered: Country / State / City / Zipcode */}
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Country
                </label>
                <SearchableSelect
                  options={allCountries}
                  value={currentCountryIso || ""}
                  onChange={(iso) => {
                    const country = allCountries.find((c) => c.value === iso);
                    if (country) {
                      update("country", country.label);
                      update("state", ""); // Clear state
                      update("city", ""); // Clear city
                    }
                  }}
                  placeholder="Select Country..."
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  State / Province
                </label>
                <SearchableSelect
                  options={allStates}
                  value={currentStateIso || ""}
                  onChange={(iso) => {
                    const state = allStates.find((s) => s.value === iso);
                    if (state) {
                      update("state", state.label);
                      update("city", ""); // Clear city on state change to ensure valid city for state
                    }
                  }}
                  placeholder="Select State..."
                  disabled={!currentCountryIso}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">City</label>
                <SearchableSelect
                  options={allCities}
                  value={form.city}
                  onChange={(val) => update("city", val)}
                  placeholder="Select City..."
                  disabled={!currentCountryIso} // Can select city if country exists, state is optional but helps
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Postal / Zip Code
                </label>
                <Input
                  value={form.postalCode}
                  onChange={(e) => update("postalCode", e.target.value)}
                  placeholder="Zip Code"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {profileError && (
          <div className="mr-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
            {profileError}
          </div>
        )}
        <Button
          variant="primary"
          size="sm"
          disabled={!dirty || saving}
          loading={saving}
          onClick={handleSave}
        >
          Save Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
