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

export function UserProfileSettings() {
  const { user, updateUser } = useSettings();
  const { currentUser, updateCurrentUser } = useAuth();
  const [form, setForm] = useState<UserSettingsData>(user);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [imgError, setImgError] = useState(false);

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
          const data = await res.json();
          if (data?.success && data?.user) {
            const dbUser = data.user;
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
        } catch (e) {
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

  async function handleSave() {
    setProfileError("");
    setSaving(true);

    try {
      // If database is configured and a user is logged in, persist to DB
      if (shouldUseDatabaseData() && currentUser) {
        let avatarUrlToSet: string | undefined = undefined;

        if (form.avatarDataUrl && form.avatarDataUrl.startsWith("data:")) {
          try {
            // Convert data URL to Blob and upload to blob storage via existing endpoint
            const res = await fetch(form.avatarDataUrl);
            const blob = await res.blob();
            const fd = new FormData();
            fd.append(
              "file",
              new File([blob], "avatar.png", { type: blob.type || "image/png" })
            );
            const upload = await fetch("/api/test-blob", {
              method: "POST",
              body: fd,
            });
            const upData = await upload.json();
            if (upData?.success && upData?.url) {
              avatarUrlToSet = upData.url as string;
            }
          } catch (e) {
            // Non-fatal; keep going without avatar update
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
        if (avatarUrlToSet) payload.avatar_url = avatarUrlToSet;

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

      // Always persist UI settings locally
      updateUser(form);
      setDirty(false);

      // Sync with Auth Context (Header/Session) in ALL modes
      updateCurrentUser({
        name: form.fullName,
        email: form.email,
        avatarUrl: form.avatarDataUrl,
      });
    } catch (e: any) {
      setProfileError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "w-24 h-24 rounded-full bg-secondary border flex items-center justify-center overflow-hidden"
              )}
            >
              {form.avatarDataUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarDataUrl}
                  alt="Avatar"
                  className="object-cover w-full h-full"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-2xl font-semibold text-muted-foreground">
                  {form.fullName
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
              )}
            </div>
            <label className="text-xs font-medium cursor-pointer inline-flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <span className="px-2 py-1 rounded bg-accent text-accent-foreground text-xs">
                Upload
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Full Name
              </label>
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
