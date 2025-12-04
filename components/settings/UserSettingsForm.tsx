"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/settings/SettingsProvider";
import { useAuth } from "@/components/auth/AuthContext";
import { updateUserCredentials } from "@/components/auth/AuthContext";
import type { UserSettingsData } from "@/lib/settings";
import { shouldUseDatabaseData } from "@/lib/dataSource";

export function UserSettingsForm() {
  const { user, updateUser } = useSettings();
  const { currentUser, updateCurrentUser } = useAuth();
  const [form, setForm] = useState<UserSettingsData>(user);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Credentials form
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credentialsError, setCredentialsError] = useState("");
  const [credentialsSuccess, setCredentialsSuccess] = useState("");
  const [savingCredentials, setSavingCredentials] = useState(false);

  // Sync incoming context user if form not modified yet
  useEffect(() => {
    if (!dirty) {
      setForm(user);
    }
  }, [user, dirty]);

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
        };
        if (avatarUrlToSet) payload.avatar_url = avatarUrlToSet;

        const resp = await fetch(`/api/users/${currentUser.id}`, {
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

        // Update auth session locally for instant reflection
        updateCurrentUser({ name: form.fullName, email: form.email });
      }

      // Always persist UI settings locally for additional fields (phone/title/bio, avatar data URL)
      updateUser(form); // Persists + toast via provider
      setDirty(false);
    } catch (e: any) {
      setProfileError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredentialsError("");
    setCredentialsSuccess("");

    if (!currentUser) {
      setCredentialsError("Not authenticated");
      return;
    }

    // Validate passwords match
    if (newPassword && newPassword !== confirmPassword) {
      setCredentialsError("Passwords do not match");
      return;
    }

    // Validate password length
    if (newPassword && newPassword.length < 6) {
      setCredentialsError("Password must be at least 6 characters");
      return;
    }

    setSavingCredentials(true);

    const success = updateUserCredentials(
      currentUser.id,
      newEmail || undefined,
      newPassword || undefined
    );

    if (success) {
      setCredentialsSuccess("Credentials updated successfully");
      setNewEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setCredentialsError("Failed to update credentials");
    }

    setSavingCredentials(false);
  }

  return (
    <>
      <Card className="overflow-hidden">
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
                {form.avatarDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatarDataUrl}
                    alt="Avatar"
                    className="object-cover w-full h-full"
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
                  Title / Role
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="e.g. Product Manager"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium mb-1 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  rows={4}
                  placeholder="Short bio about you, responsibilities, achievements..."
                  className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
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

      {/* Login Credentials Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Login Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Current Email
              </label>
              <Input
                type="text"
                value={currentUser?.email || ""}
                disabled
                className="bg-secondary"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                New Email (optional)
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Change Password</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {credentialsError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                {credentialsError}
              </div>
            )}

            {credentialsSuccess && (
              <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
                {credentialsSuccess}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={savingCredentials || (!newEmail && !newPassword)}
              loading={savingCredentials}
            >
              Update Credentials
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
