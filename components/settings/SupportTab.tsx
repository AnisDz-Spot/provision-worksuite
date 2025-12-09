"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HelpCircle, Mail, CheckCircle2, AlertCircle, X } from "lucide-react";

export function SupportTab() {
  const [supportStatus, setSupportStatus] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  }>({ show: false, type: "success", message: "" });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Support & Help</h2>
          <p className="text-sm text-muted-foreground">
            Get help and report issues
          </p>
        </div>
      </div>

      {/* Help Resources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Help</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <h4 className="font-semibold mb-2">📚 Documentation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Learn how to use all features
            </p>
            <Button variant="outline" size="sm">
              View Docs
            </Button>
          </div>
          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <h4 className="font-semibold mb-2">🎥 Video Tutorials</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Watch step-by-step guides
            </p>
            <Button variant="outline" size="sm">
              Watch Videos
            </Button>
          </div>
          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <h4 className="font-semibold mb-2">💬 Community Forum</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Ask questions and share tips
            </p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
          <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <h4 className="font-semibold mb-2">🐛 Report a Bug</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Found an issue? Let us know
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const subjectInput = document.querySelector(
                  'input[name="subject"]'
                ) as HTMLInputElement;
                const prioritySelect = document.querySelector(
                  'select[name="priority"]'
                ) as HTMLSelectElement;
                const messageTextarea = document.querySelector(
                  'textarea[name="message"]'
                ) as HTMLTextAreaElement;
                if (subjectInput) subjectInput.value = "[BUG] ";
                if (prioritySelect)
                  prioritySelect.value = "High - Blocking my work";
                if (messageTextarea) {
                  messageTextarea.value =
                    "Steps to reproduce:\n1. \n2. \n3. \n\nExpected:\n\nActual:\n\nEnvironment:";
                  messageTextarea.focus();
                }
                document
                  .querySelector("form")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Report Bug
            </Button>
          </div>
        </div>
      </Card>

      {/* Contact Support Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Support</h3>

        {/* Success/Error Toast */}
        {supportStatus.show && (
          <div
            className={`mb-4 p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top ${
              supportStatus.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            {supportStatus.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium flex-1 ${
                supportStatus.type === "success"
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {supportStatus.message}
            </p>
            <button
              onClick={() =>
                setSupportStatus({ show: false, type: "success", message: "" })
              }
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget; // Capture form before async
            setIsSubmittingSupport(true);
            setSupportStatus({ show: false, type: "success", message: "" });

            const formData = new FormData(form);
            const data = {
              subject: formData.get("subject"),
              priority: formData.get("priority"),
              message: formData.get("message"),
              to: "anisdzed@gmail.com",
            };

            try {
              const res = await fetch("/api/support/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });

              // Parse JSON first, before checking status
              let responseData;
              try {
                responseData = await res.json();
              } catch (jsonError) {
                throw new Error("Invalid response from server");
              }

              if (res.ok) {
                setSupportStatus({
                  show: true,
                  type: "success",
                  message:
                    "✅ Support request sent successfully! We'll get back to you soon.",
                });
                form.reset(); // Use captured form reference
                // Auto-hide success message after 5 seconds
                setTimeout(() => {
                  setSupportStatus({
                    show: false,
                    type: "success",
                    message: "",
                  });
                }, 5000);
              } else {
                setSupportStatus({
                  show: true,
                  type: "error",
                  message:
                    responseData.details ||
                    responseData.error ||
                    "Failed to send support request. Please try again.",
                });
              }
            } catch (error: any) {
              setSupportStatus({
                show: true,
                type: "error",
                message:
                  error.message ||
                  "Network error. Please check your connection and try again.",
              });
            } finally {
              setIsSubmittingSupport(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input
              name="subject"
              placeholder="Brief description of your issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              name="priority"
              className="w-full px-3 py-2 border rounded-lg bg-background"
              required
            >
              <option>Low - General question</option>
              <option>Medium - Need assistance</option>
              <option>High - Blocking my work</option>
              <option>Critical - System down</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              name="message"
              className="w-full min-h-[120px] px-3 py-2 border rounded-lg bg-background resize-y"
              placeholder="Describe your issue in detail..."
              required
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmittingSupport}
            >
              {isSubmittingSupport ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const form = (e.target as HTMLElement).closest("form");
                if (form) form.reset();
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </Card>

      {/* System Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version:</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-mono">
              {process.env.NODE_ENV || "development"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Browser:</span>
            <span className="font-mono">
              {typeof navigator !== "undefined"
                ? navigator.userAgent.split(" ").slice(-1)[0]
                : "Unknown"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
