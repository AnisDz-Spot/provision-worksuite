"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  CreditCard,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Key,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

export function StripeSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    isEnabled: true,
    apiKey: "",
    publicKey: "",
    webhookSecret: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/settings/stripe");
      const result = await res.json();
      if (result.success && result.data) {
        setConfig({
          isEnabled: result.data.isEnabled,
          apiKey: result.data.apiKey || "",
          publicKey: result.data.publicKey || "",
          webhookSecret: result.data.webhookSecret || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch Stripe settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetchWithCsrf("/api/settings/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({
          type: "success",
          text: "Stripe settings saved successfully!",
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to save settings",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-500">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>Stripe Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your Stripe API keys to enable real payments and
                subscription management.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
              className="animate-in slide-in-from-top-2"
            >
              {message.type === "success" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Publishable Key
                </label>
                <Input
                  value={config.publicKey}
                  onChange={(e) =>
                    setConfig({ ...config, publicKey: e.target.value })
                  }
                  placeholder="pk_test_..."
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                  Used by the frontend to initialize Stripe.js.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Secret Key
                </label>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, apiKey: e.target.value })
                  }
                  placeholder="sk_test_..."
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                  Used for server-side operations. NEVER expose this on the
                  client.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Webhook Secret
                </label>
                <Input
                  type="password"
                  value={config.webhookSecret}
                  onChange={(e) =>
                    setConfig({ ...config, webhookSecret: e.target.value })
                  }
                  placeholder="whsec_..."
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                  Used to verify authenticity of Stripe webhook events.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="stripe-enabled"
                    checked={config.isEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, isEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <label
                    htmlFor="stripe-enabled"
                    className="text-sm font-medium"
                  >
                    Enable Stripe Payments
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              Keys are encrypted with AES-256 for secure storage.
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 flex gap-3">
        <Key className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-1">Stripe Setup Tip:</p>
          <p>
            You can find your API keys in the{" "}
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              target="_blank"
              className="underline font-medium"
            >
              Stripe Dashboard
            </a>
            . Make sure to use Test keys for development environments.
          </p>
        </div>
      </div>
    </div>
  );
}
