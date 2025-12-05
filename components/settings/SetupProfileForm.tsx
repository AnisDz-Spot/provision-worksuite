"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface SetupProfileFormProps {
  onComplete: () => void;
}

export function SetupProfileForm({ onComplete }: SetupProfileFormProps) {
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    emailConfirm: "",
    password: "",
    passwordConfirm: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar image must be less than 5MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let avatarUrl = form.avatarUrl;
    try {
      if (avatarFile) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.append("file", avatarFile);
        const response = await fetch("/api/test-blob", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.success) {
          avatarUrl = data.url;
        } else {
          setError("Failed to upload avatar: " + data.error);
          setUploadingAvatar(false);
          setLoading(false);
          return;
        }
        setUploadingAvatar(false);
      }
      // Create user in database
      const response = await fetch("/api/setup/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          name: form.fullName,
          email: form.email,
          password: form.password,
          avatarUrl,
        }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("pv:setupStatus", JSON.stringify({
          databaseConfigured: true,
          profileCompleted: true,
          completedAt: new Date().toISOString(),
        }));
        onComplete();
        router.push("/");
      } else {
        setError(data.error || "Failed to create admin account");
      }
    } catch (err) {
      setError("Failed to create admin account");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    form.username &&
    form.fullName &&
    form.email &&
    form.emailConfirm &&
    form.password &&
    form.passwordConfirm &&
    form.email === form.emailConfirm &&
    form.password === form.passwordConfirm;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create Your Admin Account</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          This will be your permanent admin account. The temporary login will be
          disabled after this step.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-secondary border flex items-center justify-center overflow-hidden">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">
                  {form.fullName
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("") || "?"}
                </span>
              )}
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadingAvatar}
              />
              <div className="px-4 py-2 rounded bg-accent text-accent-foreground text-sm hover:bg-accent/80 transition-colors">
                {uploadingAvatar ? "Uploading..." : "Upload Avatar (Optional)"}
              </div>
            </label>
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="admin or your-name"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used for display and identification
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullName: e.target.value }))
              }
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="admin@company.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Confirm Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={form.emailConfirm}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, emailConfirm: e.target.value }))
                }
                placeholder="Re-enter email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    passwordConfirm: e.target.value,
                  }))
                }
                placeholder="Re-enter password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="submit"
              variant="primary"
              disabled={!isFormValid || loading || uploadingAvatar}
              className="flex-1"
            >
              {loading
                ? "Creating Account..."
                : "Complete Setup & Create Admin"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-accent/20 p-3 rounded">
            ⚠️ <strong>Important:</strong> After completing this step, use your
            new email and password to log in. The temporary{" "}
            <code>anis@provision.com</code> login will be disabled.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
