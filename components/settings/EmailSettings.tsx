"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Save,
  Trash2,
  BellRing,
  MessageSquare,
  PanelsTopLeft,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";
import { useToast } from "@/components/ui/Toast";

type EmailProvider =
  | "smtp"
  | "sendgrid"
  | "mailgun"
  | "resend"
  | "postmark"
  | "brevo"
  | "ses";

export function EmailSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<EmailProvider>("smtp");
  const [fromAddress, setFromAddress] = useState("");
  const [fromName, setFromName] = useState("");

  // SMTP fields
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);

  // Other providers
  const [sendgridApiKey, setSendgridApiKey] = useState("");
  const [mailgunApiKey, setMailgunApiKey] = useState("");
  const [mailgunDomain, setMailgunDomain] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [postmarkApiKey, setPostmarkApiKey] = useState("");
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/email");
      const data = await res.json();

      if (data.success && data.data) {
        const settings = data.data;
        setProvider(settings.provider);
        setFromAddress(settings.fromAddress || "");
        setFromName(settings.fromName || "");
        setSmtpHost(settings.smtpHost || "");
        setSmtpPort(settings.smtpPort?.toString() || "587");
        setSmtpUser(settings.smtpUser || "");
        setSmtpPassword(settings.smtpPassword || "");
        setSmtpSecure(settings.smtpSecure || false);
        setSendgridApiKey(settings.sendgridApiKey || "");
        setMailgunApiKey(settings.mailgunApiKey || "");
        setMailgunDomain(settings.mailgunDomain || "");
        setResendApiKey(settings.resendApiKey || "");
        setPostmarkApiKey(settings.postmarkApiKey || "");
        setBrevoApiKey(settings.brevoApiKey || "");
        setAwsAccessKey(settings.awsAccessKey || "");
        setAwsSecretKey(settings.awsSecretKey || "");
        setAwsRegion(settings.awsRegion || "us-east-1");
        setSlackWebhookUrl(settings.slackWebhookUrl || "");
        setTeamsWebhookUrl(settings.teamsWebhookUrl || "");
      }
    } catch (error) {
      console.error("Failed to load email settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetchWithCsrf("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          fromAddress,
          fromName,
          smtpHost,
          smtpPort: parseInt(smtpPort),
          smtpUser,
          smtpPassword,
          smtpSecure,
          sendgridApiKey,
          mailgunApiKey,
          mailgunDomain,
          resendApiKey,
          postmarkApiKey,
          brevoApiKey,
          awsAccessKey,
          awsSecretKey,
          awsRegion,
          slackWebhookUrl,
          teamsWebhookUrl,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("Email and notification settings saved successfully!");
      } else {
        showToast(`Failed to save: ${data.error}`, "error");
      }
    } catch (error: any) {
      console.error("Failed to save email settings:", error);
      showToast(`Error: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSettings = async () => {
    if (
      !confirm(
        "Are you sure you want to delete email settings? Emails will use Ethereal test mode."
      )
    ) {
      return;
    }

    try {
      const res = await fetchWithCsrf("/api/settings/email", {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Email settings deleted. Using Ethereal test mode.");
        // Reset form
        setFromAddress("");
        setFromName("");
        setSmtpHost("");
        setSmtpPort("587");
        setSmtpUser("");
        setSmtpPassword("");
        setSendgridApiKey("");
        setMailgunApiKey("");
        setMailgunDomain("");
        setResendApiKey("");
        setPostmarkApiKey("");
        setBrevoApiKey("");
        setAwsAccessKey("");
        setAwsSecretKey("");
        setAwsRegion("us-east-1");
        setSlackWebhookUrl("");
        setTeamsWebhookUrl("");
        showToast("Email and notification settings deleted.", "info");
      } else {
        showToast(`Failed to delete: ${data.error}`, "error");
      }
    } catch (error: any) {
      console.error("Failed to delete email settings:", error);
      showToast(`Error: ${error.message}`, "error");
    }
  };

  if (loading) {
    return <div className="p-6">Loading email settings...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Email Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure email provider for sending digest emails and notifications
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Email Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as EmailProvider)}
            className="w-full px-3 py-2 border rounded-lg bg-background"
          >
            <option value="smtp">SMTP (Generic)</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
            <option value="resend">Resend</option>
            <option value="postmark">Postmark</option>
            <option value="brevo">Brevo (Sendinblue)</option>
            <option value="ses">AWS SES</option>
          </select>
        </div>

        {/* Common Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              From Email *
            </label>
            <Input
              type="email"
              placeholder="noreply@example.com"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">From Name</label>
            <Input
              placeholder="ProVision WorkSuite"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
        </div>

        {/* SMTP Fields */}
        {provider === "smtp" && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">SMTP Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  SMTP Host *
                </label>
                <Input
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  SMTP Port *
                </label>
                <Input
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  SMTP User *
                </label>
                <Input
                  placeholder="user@example.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  SMTP Password *
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
              />
              <label htmlFor="smtpSecure" className="text-sm">
                Use SSL/TLS (port 465)
              </label>
            </div>
          </div>
        )}

        {/* SendGrid */}
        {provider === "sendgrid" && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">SendGrid Configuration</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">
                API Key *
              </label>
              <Input
                type="password"
                placeholder="SG.••••••••"
                value={sendgridApiKey}
                onChange={(e) => setSendgridApiKey(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Mailgun */}
        {provider === "mailgun" && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">Mailgun Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  API Key *
                </label>
                <Input
                  type="password"
                  placeholder="key-••••••••"
                  value={mailgunApiKey}
                  onChange={(e) => setMailgunApiKey(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Domain *
                </label>
                <Input
                  placeholder="mg.example.com"
                  value={mailgunDomain}
                  onChange={(e) => setMailgunDomain(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Resend */}
        {provider === "resend" && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Resend Configuration</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">
                API Key *
              </label>
              <Input
                type="password"
                placeholder="re_••••••••"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Postmark */}
        {provider === "postmark" && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Postmark Configuration</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Server API Token *
              </label>
              <Input
                type="password"
                placeholder="••••••••-••••-••••-••••-••••••••••••"
                value={postmarkApiKey}
                onChange={(e) => setPostmarkApiKey(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Brevo */}
        {provider === "brevo" && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Brevo Configuration</h3>
            <div>
              <label className="text-sm font-medium mb-1 block">
                API Key *
              </label>
              <Input
                type="password"
                placeholder="xkeysib-••••••••"
                value={brevoApiKey}
                onChange={(e) => setBrevoApiKey(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* AWS SES */}
        {provider === "ses" && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">AWS SES Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">
                  AWS Region *
                </label>
                <Input
                  placeholder="us-east-1"
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Access Key ID *
                </label>
                <Input
                  placeholder="AKIA••••••••"
                  value={awsAccessKey}
                  onChange={(e) => setAwsAccessKey(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Secret Access Key *
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={awsSecretKey}
                  onChange={(e) => setAwsSecretKey(e.target.value)}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Note: Ensure your SES identity (email or domain) is verified in
              the AWS Console.
            </p>
          </div>
        )}

        {/* Webhooks Section */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <BellRing className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-lg">Notification Webhooks</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Configure webhooks to post weekly digests directly to your team
            channels.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-[#4A154B]" />
                <label className="text-sm font-medium">Slack Webhook URL</label>
              </div>
              <Input
                type="password"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Incoming Webhook URL for your Slack workspace.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <PanelsTopLeft className="w-4 h-4 text-[#5059C9]" />
                <label className="text-sm font-medium">
                  Microsoft Teams Webhook URL
                </label>
              </div>
              <Input
                type="password"
                placeholder="https://outlook.office.com/webhook/..."
                value={teamsWebhookUrl}
                onChange={(e) => setTeamsWebhookUrl(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Incoming Webhook connector URL for your Teams channel.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-600 mb-1">ℹ️ Email Behavior</p>
          <p className="text-muted-foreground">
            Configure a provider to enable email delivery. If no provider is
            set, email sending will fail with a configuration prompt.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={deleteSettings}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Settings
          </Button>
        </div>
      </div>
    </Card>
  );
}
