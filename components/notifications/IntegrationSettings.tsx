"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Send,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/auth/AuthContext";

type EmailProvider =
  | "smtp"
  | "sendgrid"
  | "mailgun"
  | "postmark"
  | "resend"
  | "brevo";

type EmailConfig = {
  enabled: boolean;
  provider: EmailProvider;
  fromAddress: string;
  toAddress: string;
  frequency: "instant" | "hourly" | "daily";
  smtp?: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  postmark?: {
    serverToken: string;
  };
  resend?: {
    apiKey: string;
  };
  brevo?: {
    apiKey: string;
  };
};

type IntegrationConfig = {
  email: EmailConfig;
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
};

const DEFAULT_CONFIG: IntegrationConfig = {
  email: {
    enabled: false,
    provider: "smtp",
    fromAddress: "",
    toAddress: "",
    frequency: "instant",
    smtp: {
      host: "",
      port: 587,
      user: "",
      password: "",
      secure: false,
    },
    sendgrid: {
      apiKey: "",
    },
    mailgun: {
      apiKey: "",
      domain: "",
    },
    postmark: {
      serverToken: "",
    },
    resend: {
      apiKey: "",
    },
    brevo: {
      apiKey: "",
    },
  },
  slack: {
    enabled: false,
    webhookUrl: "",
    channel: "#project-alerts",
  },
};

export function IntegrationSettings({
  mode = "both",
}: {
  mode?: "email" | "slack" | "both";
}) {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<IntegrationConfig>(DEFAULT_CONFIG);
  const [draftConfig, setDraftConfig] = useState<IntegrationConfig | null>(
    null
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [testing, setTesting] = useState<{ email: boolean; slack: boolean }>({
    email: false,
    slack: false,
  });
  const [testResults, setTestResults] = useState<{
    email?: string;
    slack?: string;
  }>({});
  const [mounted, setMounted] = useState(false);
  const [realSendEmail, setRealSendEmail] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadConfig();
  }, []);

  const loadConfig = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("pv:integrationConfig");
      if (stored) {
        const loaded = JSON.parse(stored);
        const merged: IntegrationConfig = {
          email: {
            ...DEFAULT_CONFIG.email,
            ...(loaded.email || {}),
            smtp: {
              ...DEFAULT_CONFIG.email.smtp!,
              ...((loaded.email && loaded.email.smtp) || {}),
            },
            sendgrid: {
              ...DEFAULT_CONFIG.email.sendgrid!,
              ...((loaded.email && loaded.email.sendgrid) || {}),
            },
            mailgun: {
              ...DEFAULT_CONFIG.email.mailgun!,
              ...((loaded.email && loaded.email.mailgun) || {}),
            },
            postmark: {
              ...DEFAULT_CONFIG.email.postmark!,
              ...((loaded.email && loaded.email.postmark) || {}),
            },
            resend: {
              ...DEFAULT_CONFIG.email.resend!,
              ...((loaded.email && loaded.email.resend) || {}),
            },
            brevo: {
              ...DEFAULT_CONFIG.email.brevo!,
              ...((loaded.email && loaded.email.brevo) || {}),
            },
          },
          slack: {
            ...DEFAULT_CONFIG.slack,
            ...(loaded.slack || {}),
          },
        };
        setConfig(merged);
        setDraftConfig(merged);
      } else {
        setDraftConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error("Error loading integration config:", error);
      setDraftConfig(DEFAULT_CONFIG);
    }
  };

  const updateDraft = (updated: IntegrationConfig) => {
    setDraftConfig(updated);
    setHasChanges(true);
  };

  const saveChanges = () => {
    if (!draftConfig) return;
    setConfig(draftConfig);
    localStorage.setItem("pv:integrationConfig", JSON.stringify(draftConfig));
    setHasChanges(false);
  };

  const cancelChanges = () => {
    setDraftConfig(config);
    setHasChanges(false);
  };

  const testEmailIntegration = async () => {
    if (hasChanges) {
      alert("Please save your changes before testing.");
      return;
    }
    setTesting({ ...testing, email: true });
    setTestResults({ ...testResults, email: undefined });
    try {
      const res = await fetch("/api/integrations/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailConfig: config.email,
          realSend: realSendEmail,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.previewUrl) {
          console.info("Email preview URL:", data.previewUrl);
        }
        setTestResults({ ...testResults, email: "success" });
      } else {
        console.error("Email test failed:", data?.error);
        setTestResults({ ...testResults, email: "error" });
      }
    } catch (e) {
      console.error("Email test error:", e);
      setTestResults({ ...testResults, email: "error" });
    } finally {
      setTesting({ ...testing, email: false });
    }
  };

  const testSlackIntegration = async () => {
    if (hasChanges) {
      alert("Please save your changes before testing.");
      return;
    }
    setTesting({ ...testing, slack: true });
    setTestResults({ ...testResults, slack: undefined });
    try {
      const res = await fetch("/api/integrations/test-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: config.slack.webhookUrl,
          channel: config.slack.channel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResults({ ...testResults, slack: "success" });
      } else {
        console.error("Slack test failed:", data?.error);
        setTestResults({ ...testResults, slack: "error" });
      }
    } catch (e) {
      console.error("Slack test error:", e);
      setTestResults({ ...testResults, slack: "error" });
    } finally {
      setTesting({ ...testing, slack: false });
    }
  };

  if (!mounted || !draftConfig) return null;

  return (
    <div className="space-y-6">
      {/* Email Integration */}
      {(mode === "both" || mode === "email") && (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Email Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Receive alerts via email
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={draftConfig.email.enabled}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  email: { ...draftConfig.email, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {draftConfig.email.enabled && (
          <div className="space-y-4">
            {/* Admin-only notice */}
            {!isAdmin && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Admin Access Required
                  </p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Only administrators can configure email providers for the
                    entire application. Please contact your admin to update
                    these settings.
                  </p>
                </div>
              </div>
            )}
            {/* Email Provider Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Email Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    isAdmin &&
                    updateDraft({
                      ...draftConfig,
                      email: { ...draftConfig.email, provider: "smtp" },
                    })
                  }
                  disabled={!isAdmin}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    draftConfig.email.provider === "smtp"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-4 h-4" />
                    <span className="font-medium text-sm">SMTP</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Custom email server
                  </p>
                </button>
                <button
                  onClick={() =>
                    isAdmin &&
                    updateDraft({
                      ...draftConfig,
                      email: { ...draftConfig.email, provider: "sendgrid" },
                    })
                  }
                  disabled={!isAdmin}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    draftConfig.email.provider === "sendgrid"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="w-4 h-4" />
                    <span className="font-medium text-sm">SendGrid</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API-based delivery
                  </p>
                </button>
                <button
                  onClick={() =>
                    isAdmin &&
                    updateDraft({
                      ...draftConfig,
                      email: { ...draftConfig.email, provider: "mailgun" },
                    })
                  }
                  disabled={!isAdmin}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    draftConfig.email.provider === "mailgun"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium text-sm">Mailgun</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Transactional email
                  </p>
                </button>
                <button
                  onClick={() =>
                    isAdmin &&
                    updateDraft({
                      ...draftConfig,
                      email: { ...draftConfig.email, provider: "postmark" },
                    })
                  }
                  disabled={!isAdmin}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    draftConfig.email.provider === "postmark"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4" />
                    <span className="font-medium text-sm">Postmark</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fast & reliable
                  </p>
                </button>
                <button
                  onClick={() =>
                    isAdmin &&
                    updateDraft({
                      ...draftConfig,
                      email: { ...draftConfig.email, provider: "resend" },
                    })
                  }
                  disabled={!isAdmin}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    draftConfig.email.provider === "resend"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium text-sm">Resend</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Modern API (Free tier)
                  </p>
                </button>
                <button
                  onClick={() =>
                    isAdmin &&
                    updateDraft({
                      ...draftConfig,
                      email: { ...draftConfig.email, provider: "brevo" },
                    })
                  }
                  disabled={!isAdmin}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    draftConfig.email.provider === "brevo"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${!isAdmin && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Send className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      Brevo (Sendinblue)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    300 emails/day free
                  </p>
                </button>
              </div>
            </div>

            {/* Common Email Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  From Address
                </label>
                <Input
                  type="email"
                  value={draftConfig.email.fromAddress || ""}
                  onChange={(e) =>
                    updateDraft({
                      ...draftConfig,
                      email: {
                        ...draftConfig.email,
                        fromAddress: e.target.value,
                      },
                    })
                  }
                  placeholder="noreply@yourapp.com"
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  To Address (for testing)
                </label>
                <Input
                  type="email"
                  value={draftConfig.email.toAddress || ""}
                  onChange={(e) =>
                    updateDraft({
                      ...draftConfig,
                      email: {
                        ...draftConfig.email,
                        toAddress: e.target.value,
                      },
                    })
                  }
                  placeholder="you@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your email for receiving test notifications
                </p>
              </div>
            </div>

            {/* Provider-specific Configuration */}
            {draftConfig.email.provider === "smtp" && (
              <div className="p-4 bg-accent/20 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  SMTP Configuration
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      SMTP Host
                    </label>
                    <Input
                      value={draftConfig.email.smtp?.host || ""}
                      onChange={(e) =>
                        updateDraft({
                          ...draftConfig,
                          email: {
                            ...draftConfig.email,
                            smtp: {
                              ...draftConfig.email.smtp!,
                              host: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="smtp.gmail.com"
                      className="text-sm"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Port
                    </label>
                    <Input
                      type="number"
                      value={draftConfig.email.smtp?.port || 587}
                      onChange={(e) =>
                        updateDraft({
                          ...draftConfig,
                          email: {
                            ...draftConfig.email,
                            smtp: {
                              ...draftConfig.email.smtp!,
                              port: parseInt(e.target.value) || 587,
                            },
                          },
                        })
                      }
                      placeholder="587"
                      className="text-sm"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Username
                    </label>
                    <Input
                      value={draftConfig.email.smtp?.user || ""}
                      onChange={(e) =>
                        updateDraft({
                          ...draftConfig,
                          email: {
                            ...draftConfig.email,
                            smtp: {
                              ...draftConfig.email.smtp!,
                              user: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="your-email@gmail.com"
                      className="text-sm"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={draftConfig.email.smtp?.password || ""}
                      onChange={(e) =>
                        updateDraft({
                          ...draftConfig,
                          email: {
                            ...draftConfig.email,
                            smtp: {
                              ...draftConfig.email.smtp!,
                              password: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="••••••••"
                      className="text-sm"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftConfig.email.smtp?.secure || false}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          smtp: {
                            ...draftConfig.email.smtp!,
                            secure: e.target.checked,
                          },
                        },
                      })
                    }
                    className="rounded cursor-pointer"
                    disabled={!isAdmin}
                  />
                  <span>Use SSL/TLS (port 465)</span>
                </label>
              </div>
            )}

            {draftConfig.email.provider === "sendgrid" && (
              <div className="p-4 bg-accent/20 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  SendGrid Configuration
                </h4>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={draftConfig.email.sendgrid?.apiKey || ""}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          sendgrid: { apiKey: e.target.value },
                        },
                      })
                    }
                    placeholder="SG.••••••••"
                    className="text-sm font-mono"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://app.sendgrid.com/settings/api_keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      SendGrid Dashboard
                    </a>
                  </p>
                </div>
              </div>
            )}

            {draftConfig.email.provider === "mailgun" && (
              <div className="p-4 bg-accent/20 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Mailgun Configuration
                </h4>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={draftConfig.email.mailgun?.apiKey || ""}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          mailgun: {
                            ...draftConfig.email.mailgun!,
                            apiKey: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="key-••••••••"
                    className="text-sm font-mono"
                    disabled={!isAdmin}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Domain
                  </label>
                  <Input
                    value={draftConfig.email.mailgun?.domain || ""}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          mailgun: {
                            ...draftConfig.email.mailgun!,
                            domain: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="mg.yourdomain.com"
                    className="text-sm"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Find in{" "}
                    <a
                      href="https://app.mailgun.com/app/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Mailgun Domains
                    </a>
                  </p>
                </div>
              </div>
            )}

            {draftConfig.email.provider === "postmark" && (
              <div className="p-4 bg-accent/20 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Postmark Configuration
                </h4>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Server Token
                  </label>
                  <Input
                    type="password"
                    value={draftConfig.email.postmark?.serverToken || ""}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          postmark: { serverToken: e.target.value },
                        },
                      })
                    }
                    placeholder="••••••••-••••-••••-••••-••••••••••••"
                    className="text-sm font-mono"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get from{" "}
                    <a
                      href="https://account.postmarkapp.com/servers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Postmark Servers
                    </a>
                  </p>
                </div>
              </div>
            )}

            {draftConfig.email.provider === "resend" && (
              <div className="p-4 bg-accent/20 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Resend Configuration
                </h4>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={draftConfig.email.resend?.apiKey || ""}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          resend: { apiKey: e.target.value },
                        },
                      })
                    }
                    placeholder="re_••••••••"
                    className="text-sm font-mono"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get your API key from{" "}
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Resend Dashboard
                    </a>{" "}
                    • 100 emails/day free
                  </p>
                </div>
              </div>
            )}

            {draftConfig.email.provider === "brevo" && (
              <div className="p-4 bg-accent/20 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Brevo (Sendinblue) Configuration
                </h4>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={draftConfig.email.brevo?.apiKey || ""}
                    onChange={(e) =>
                      updateDraft({
                        ...draftConfig,
                        email: {
                          ...draftConfig.email,
                          brevo: { apiKey: e.target.value },
                        },
                      })
                    }
                    placeholder="xkeysib-••••••••"
                    className="text-sm font-mono"
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get from{" "}
                    <a
                      href="https://app.brevo.com/settings/keys/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Brevo API Keys
                    </a>{" "}
                    • 300 emails/day free
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Notification Frequency
              </label>
              <select
                value={draftConfig.email.frequency || "instant"}
                onChange={(e) =>
                  updateDraft({
                    ...draftConfig,
                    email: {
                      ...draftConfig.email,
                      frequency: e.target.value as any,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm cursor-pointer"
                disabled={!isAdmin}
              >
                <option value="instant">Instant - Send immediately</option>
                <option value="hourly">Hourly - Digest every hour</option>
                <option value="daily">Daily - Daily summary</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <>
                    <Button variant="primary" size="sm" onClick={saveChanges}>
                      Save Changes
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelChanges}>
                      Cancel
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testEmailIntegration}
                  disabled={
                    testing.email || !draftConfig.email.toAddress || hasChanges
                  }
                >
                  <Zap className="w-4 h-4 mr-1" />
                  {testing.email ? "Testing..." : "Test Connection"}
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={realSendEmail}
                  onChange={(e) => setRealSendEmail(e.target.checked)}
                  className="rounded cursor-pointer"
                />
                <span>
                  Send real email (bypass sandbox mode - may consume credits)
                </span>
              </label>

              {testResults.email === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Email sent successfully!</span>
                </div>
              )}

              {testResults.email === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Failed to send email</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
      )}

      {/* Slack Integration */}
      {(mode === "both" || mode === "slack") && (
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Slack Integration</h2>
              <p className="text-sm text-muted-foreground">
                Push notifications to Slack channels
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={draftConfig.slack.enabled}
              onChange={(e) =>
                updateDraft({
                  ...draftConfig,
                  slack: { ...draftConfig.slack, enabled: e.target.checked },
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {draftConfig.slack.enabled && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Setting up Slack Webhook
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>Go to your Slack workspace settings</li>
                <li>Create a new incoming webhook</li>
                <li>Copy the webhook URL and paste it below</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Webhook URL
              </label>
              <Input
                type="url"
                value={draftConfig.slack.webhookUrl || ""}
                onChange={(e) =>
                  updateDraft({
                    ...draftConfig,
                    slack: { ...draftConfig.slack, webhookUrl: e.target.value },
                  })
                }
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Channel</label>
              <Input
                value={draftConfig.slack.channel || ""}
                onChange={(e) =>
                  updateDraft({
                    ...draftConfig,
                    slack: { ...draftConfig.slack, channel: e.target.value },
                  })
                }
                placeholder="#project-alerts"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Channel or user to receive notifications
                {hasChanges && (
                  <>
                    <Button variant="primary" size="sm" onClick={saveChanges}>
                      Save Changes
                    </Button>
                    <Button variant="outline" size="sm" onClick={cancelChanges}>
                      Cancel
                    </Button>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testSlackIntegration}
                disabled={
                  testing.slack || !draftConfig.slack.webhookUrl || hasChanges
                }
              >
                <Zap className="w-4 h-4 mr-1" />
                {testing.slack ? "Testing..." : "Test Connection"}
              </Button>

              {testResults.slack === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Message sent to Slack!</span>
                </div>
              )}

              {testResults.slack === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Failed to send message</span>
                </div>
              )}
            </div>
          </div>
        )}
        )}
      </Card>
      )}

      {/* Integration Status Summary */}
      {mode === "both" && (
      <Card className="p-6 bg-accent/20">
        <h3 className="font-semibold mb-4">Integration Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email Notifications</span>
            </div>
            <Badge
              variant={draftConfig.email.enabled ? "success" : "secondary"}
            >
              {draftConfig.email.enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Slack Integration</span>
            </div>
            <Badge
              variant={draftConfig.slack.enabled ? "success" : "secondary"}
            >
              {draftConfig.slack.enabled ? "Active" : "Disabled"}
            </Badge>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
}
