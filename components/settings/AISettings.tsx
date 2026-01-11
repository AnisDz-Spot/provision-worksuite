"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import {
  Brain,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

/**
 * AI Provider Registry
 * Maps providers to their specific model lists and default base URLs
 */
const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
    baseUrl: "https://api.openai.com/v1",
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    models: ["claude-3.5-sonnet", "claude-3-opus"],
    baseUrl: "https://api.anthropic.com/v1",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"],
    baseUrl: "",
  },
  {
    id: "groq",
    name: "Groq",
    models: ["llama-3.1-70b", "mixtral-8x7b"],
    baseUrl: "https://api.groq.com/openai/v1",
  },
  {
    id: "together",
    name: "Together AI",
    models: ["llama-3.1-405b", "llama-3.1-70b", "llama-3.1-8b", "mixtral-8x7b"],
    baseUrl: "https://api.together.xyz/v1",
  },
];

export function AISettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
    baseUrl: "",
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
      const res = await fetch("/api/settings/ai");
      const result = await res.json();
      if (result.success && result.data) {
        setConfig({
          provider: result.data.ai_provider || "openai",
          model: result.data.ai_model || "gpt-4o-mini",
          apiKey: result.data.ai_api_key || "",
          baseUrl: result.data.ai_base_url || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch AI settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetchWithCsrf("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({
          type: "success",
          text: "AI settings saved successfully!",
        });
        // Refresh after 2 seconds to hide masked key or update view
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

  const selectedProvider = PROVIDERS.find((p) => p.id === config.provider);

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
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <CardTitle>AI Configuration</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure your preferred AI provider to enable agentic features
                across the platform.
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
                  AI Provider
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const p = PROVIDERS.find((x) => x.id === selectedId);
                    setConfig({
                      ...config,
                      provider: selectedId as any,
                      model: p?.models[0] || "",
                      baseUrl: p?.baseUrl || "",
                    });
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                  Provider handles the API connection and token management.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Model Instance
                </label>
                <select
                  value={config.model}
                  onChange={(e) =>
                    setConfig({ ...config, model: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {selectedProvider?.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                  Choose between high-intelligence or low-latency models.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  API Credentials
                </label>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, apiKey: e.target.value })
                  }
                  placeholder="Paste your API key here"
                  className="font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                  Keys are encrypted using <strong>AES-256-CBC</strong> before
                  database storage.
                </p>
              </div>

              {(config.provider === "groq" ||
                config.provider === "together" ||
                config.provider === "openai") && (
                <div className="animate-in fade-in duration-300">
                  <label className="text-sm font-medium mb-1.5 block">
                    Proxy / Custom Base URL
                  </label>
                  <Input
                    value={config.baseUrl}
                    onChange={(e) =>
                      setConfig({ ...config, baseUrl: e.target.value })
                    }
                    placeholder="https://api.provider.com/v1"
                    className="font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                    Required for inference gateways like Groq or Together.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-between">
            <div className="flex -space-x-2">
              {/* Visual indicators of supported providers */}
              {PROVIDERS.map((p) => (
                <div
                  key={p.id}
                  className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold uppercase overflow-hidden"
                >
                  {p.name.substring(0, 2)}
                </div>
              ))}
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
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border bg-muted/20 border-border group hover:bg-muted/40 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Predictive Risk</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Analyzes project health by identifying blockers and scoring
            complexity.
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-muted/20 border-border group hover:bg-muted/40 transition-colors">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Task Architect</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automatically breaks down milestones into granular tasks with
            estimates.
          </p>
        </div>
        <div className="p-4 rounded-xl border bg-muted/20 border-border group hover:bg-muted/40 transition-colors">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm mb-1">Audit Summaries</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Generates executive weekly digests based on system-wide audit logs.
          </p>
        </div>
      </div>
    </div>
  );
}
