import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DigestSchedule, RecipientUser } from "./types";

interface DigestSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: DigestSchedule;
  setSchedule: (schedule: DigestSchedule) => void;
  users: RecipientUser[];
  loadingUsers: boolean;
  slackWebhookUrl: string;
  setSlackWebhookUrl: (url: string) => void;
  teamsWebhookUrl: string;
  setTeamsWebhookUrl: (url: string) => void;
}

export const DigestSettingsModal: React.FC<DigestSettingsModalProps> = ({
  open,
  onOpenChange,
  schedule,
  setSchedule,
  users,
  loadingUsers,
  slackWebhookUrl,
  setSlackWebhookUrl,
  teamsWebhookUrl,
  setTeamsWebhookUrl,
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="w-[85vw] md:w-[50vw] lg:w-[33vw]"
    >
      <h3 className="text-lg font-semibold mb-4">Digest Settings</h3>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Day of Week
            </label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              value={schedule.dayOfWeek}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  dayOfWeek: parseInt(e.target.value),
                })
              }
            >
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((day, idx) => (
                <option key={idx} value={idx}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Time</label>
            <Input
              type="time"
              value={schedule.time}
              onChange={(e) =>
                setSchedule({ ...schedule, time: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium block">Recipients</label>
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => {
                const allEmails = users.map((u) => u.email);
                const isAllSelected = allEmails.every((email) =>
                  schedule.recipients.includes(email)
                );
                setSchedule({
                  ...schedule,
                  recipients: isAllSelected ? [] : allEmails,
                });
              }}
            >
              {users.length > 0 &&
              users.every((u) => schedule.recipients.includes(u.email))
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
            {loadingUsers ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading members...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No members found.
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => {
                    const exists = schedule.recipients.includes(u.email);
                    setSchedule({
                      ...schedule,
                      recipients: exists
                        ? schedule.recipients.filter((r) => r !== u.email)
                        : [...schedule.recipients, u.email],
                    });
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border bg-accent"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.email}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={schedule.recipients.includes(u.email)}
                    readOnly
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Select users who should receive the weekly progress update.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Save Settings
          </Button>

          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-2">Automation Help</h4>
            <p className="text-xs text-muted-foreground mb-3">
              The scheduler runs in the background every 10 minutes. If you want
              to test the automation logic immediately:
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={async () => {
                const btn = document.activeElement as HTMLButtonElement;
                const originalText = btn.innerText;
                btn.innerText = "Triggering...";
                btn.disabled = true;

                try {
                  const res = await fetch(
                    "/api/digest/cron?secret=provision-default-cron-secret"
                  );
                  const data = await res.json();
                  if (data.success) {
                    alert(
                      `Automation Trigger Success!\nProcessed: ${data.processed}\nSent: ${data.sent}\nCheck server console for details.`
                    );
                  } else {
                    alert(
                      `Automation Failed: ${data.error || "Unknown error"}`
                    );
                  }
                } catch (err) {
                  alert("Failed to connect to automation endpoint");
                } finally {
                  btn.innerText = originalText;
                  btn.disabled = false;
                }
              }}
            >
              Run Automation Logic Now
            </Button>
          </div>
        </div>
        <div className="pt-6 border-t mt-2">
          <h4 className="text-sm font-semibold mb-2">Webhooks</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Slack Incoming Webhook URL
              </label>
              <Input
                type="url"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                onBlur={() => {
                  try {
                    localStorage.setItem("pv:webhook:slack", slackWebhookUrl);
                  } catch {}
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Teams Incoming Webhook URL
              </label>
              <Input
                type="url"
                value={teamsWebhookUrl}
                onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                placeholder="https://outlook.office.com/webhook/..."
                onBlur={() => {
                  try {
                    localStorage.setItem("pv:webhook:teams", teamsWebhookUrl);
                  } catch {}
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
