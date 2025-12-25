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
import type { WorkspaceSettingsData } from "@/lib/settings";

const timezones = [
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function WorkspaceSettingsForm() {
  const { workspace, updateWorkspace } = useSettings();
  const [form, setForm] = useState<WorkspaceSettingsData>(workspace);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!dirty) {
      setForm(workspace);
    }
  }, [workspace, dirty]);

  function update<K extends keyof WorkspaceSettingsData>(
    key: K,
    value: WorkspaceSettingsData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      const compressed = await compressImage(dataUrl, 256, 256, 0.8);
      update("logoDataUrl", compressed);
    } catch {}
  }

  function handleSave() {
    setSaving(true);
    updateWorkspace(form);
    setTimeout(() => {
      setSaving(false);
      setDirty(false);
    }, 150);
  }

  async function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function compressImage(
    dataUrl: string,
    maxW: number,
    maxH: number,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const out = canvas.toDataURL("image/jpeg", quality);
        resolve(out.length < dataUrl.length ? out : dataUrl);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Workspace / Agency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "w-24 h-24 rounded-lg bg-secondary border flex items-center justify-center overflow-hidden"
              )}
            >
              {form.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoDataUrl}
                  alt="Logo"
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-sm text-muted-foreground">No Logo</span>
              )}
            </div>
            <label className="text-xs font-medium cursor-pointer inline-flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
              <span className="px-2 py-1 rounded bg-accent text-accent-foreground text-xs">
                Upload Logo
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">
                Workspace / Agency Name
              </label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Your company or workspace"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">Tagline</label>
              <Input
                value={form.tagline}
                onChange={(e) => update("tagline", e.target.value)}
                placeholder="Short punchy tagline"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">
                Website URL
              </label>
              <Input
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://"
              />
            </div>

            {/* Contact & Billing */}
            <div className="md:col-span-1">
              <label className="text-xs font-medium mb-1 block">
                Contact Email
              </label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) => update("email", e.target.value)}
                placeholder="contact@agency.com"
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-medium mb-1 block">
                Phone Number
              </label>
              <Input
                type="tel"
                value={form.phone || ""}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">
                Business Address
              </label>
              <Input
                value={form.address || ""}
                onChange={(e) => update("address", e.target.value)}
                placeholder="123 Business St, City, Country"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">
                Tax ID / VAT Number
              </label>
              <Input
                value={form.taxId || ""}
                onChange={(e) => update("taxId", e.target.value)}
                placeholder="US-123456789"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Primary Theme Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  className="h-10 w-14 rounded cursor-pointer border border-border bg-transparent"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => update("primaryColor", e.target.value)}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="primary"
          size="sm"
          disabled={!dirty || saving}
          loading={saving}
          onClick={handleSave}
        >
          Save Workspace
        </Button>
      </CardFooter>
    </Card>
  );
}
