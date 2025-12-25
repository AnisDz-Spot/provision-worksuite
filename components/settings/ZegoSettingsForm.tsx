"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getCsrfToken } from "@/lib/csrf-client";
import {
  AlertCircle,
  CheckCircle2,
  Video,
  Loader2,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/Alert";

export function ZegoSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [appId, setAppId] = useState("");
  const [serverSecret, setServerSecret] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/video");
      if (res.ok) {
        const data = await res.json();
        if (data.appId) {
          setAppId(data.appId);
          setServerSecret(data.serverSecret || "");
          setIsSaved(true);
        }
      }
    } catch (e) {
      console.error("Failed to fetch Zego settings:", e);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/settings/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() || "",
        },
        body: JSON.stringify({ appId, serverSecret }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      setSuccess(true);
      setIsSaved(true);
      // Re-fetch to get masked secret
      fetchSettings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (
      !confirm(
        "Are you sure you want to clear these credentials? The system will fall back to environment variables."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/settings/video", {
        method: "DELETE",
        headers: {
          "x-csrf-token": getCsrfToken() || "",
        },
      });
      if (res.ok) {
        setAppId("");
        setServerSecret("");
        setIsSaved(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (e) {
      setError("Failed to clear settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Video Conference Credentials</h2>
            <p className="text-sm text-muted-foreground">
              Configure your own ZegoCloud AppID and ServerSecret
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ZegoCloud AppID</label>
            <Input
              type="number"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="e.g. 123456789"
              required
              disabled={loading}
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Numeric ID found in your ZegoCloud Admin Console project settings.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              ZegoCloud Server Secret
            </label>
            <Input
              type="text"
              value={serverSecret}
              onChange={(e) => setServerSecret(e.target.value)}
              placeholder={isSaved ? "••••••••••••••••" : "Your Server Secret"}
              required={!isSaved}
              disabled={loading}
              className="font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Secret string used to generate tokens. Kept secure on our servers.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Settings saved successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={loading} className="px-8">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>

            {isSaved && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={loading}
                className="text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="p-6 bg-muted/30 border-dashed">
        <h3 className="text-sm font-semibold mb-2">💡 Quick Help</h3>
        <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
          <li>
            Sign up or log in at{" "}
            <a
              href="https://www.zegocloud.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ZegoCloud.com
            </a>
          </li>
          <li>Create a project and select "Voice & Video Call" scenario</li>
          <li>Choose "UIKit" for the fastest integration</li>
          <li>
            Copy your "AppID" and "Server Secret" from the project management
            page
          </li>
          <li>
            Using custom credentials will override any system-level environment
            variables.
          </li>
        </ul>
      </Card>
    </div>
  );
}
