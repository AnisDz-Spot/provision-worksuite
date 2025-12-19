"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { SessionList } from "@/components/settings/SessionList";
import { LinkedAccountsSettings } from "@/components/settings/LinkedAccountsSettings";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  Shield,
  Smartphone,
  Key,
  Lock,
  Laptop,
  Copy,
  RefreshCw,
  Eye,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function SecuritySettings() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [regenerating, setRegenerating] = useState(false);

  const { showToast } = useToast();

  // Password Change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const fetchUserStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/user/status", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setIs2FAEnabled(json.data.twoFactorEnabled);
          setBackupCodesCount(json.data.backupCodesRemaining);
        }
      } else {
        console.error(
          "Failed to fetch user status:",
          res.status,
          res.statusText
        );
      }
    } catch (e) {
      console.error("Error fetching user status:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (passwords.new.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    setPasswordUpdating(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      showToast("Password updated successfully", "success");
      setShowPasswordModal(false);
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleDisable2FA = async () => {
    if (
      !confirm(
        "Are you sure you want to disable Two-Factor Authentication? Your account will be less secure."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: "" }),
      });

      if (!res.ok) throw new Error("Failed to disable 2FA");

      setIs2FAEnabled(false);
      setBackupCodesCount(0);
      showToast("Two-Factor Authentication disabled", "success");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    if (!passwordConfirm) {
      showToast("Please enter your password", "error");
      return;
    }

    setRegenerating(true);
    try {
      const res = await fetch("/api/auth/2fa/regenerate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: passwordConfirm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewBackupCodes(data.backupCodes);
      setBackupCodesCount(10);
      setShowRegenerateConfirm(false); // Close confirm modal
      setPasswordConfirm("");
      // Keep main modal open to show codes (or switch view mode)
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  };

  const downloadBackupCodes = () => {
    const text = `ProVision WorkSuite Backup Codes\n\nGenerated on: ${new Date().toLocaleDateString()}\nKeep these safe! Old codes are invalid.\n\n${newBackupCodes.join(
      "\n"
    )}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "provision-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Setup View
  if (isSettingUp) {
    return (
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Setup Two-Factor Authentication</h2>
          <Button variant="ghost" onClick={() => setIsSettingUp(false)}>
            Cancel
          </Button>
        </div>
        <TwoFactorSetup
          onComplete={() => {
            setIsSettingUp(false);
            setIs2FAEnabled(true);
            setBackupCodesCount(10); // Assume setup gives 10
            fetchUserStatus(); // Refresh to be sure
          }}
          onCancel={() => setIsSettingUp(false)}
        />
      </Card>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Security Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account security and authentication methods.
        </p>
      </div>

      {/* 2FA Section */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Two-Factor Authentication (2FA)
              </h3>
              {is2FAEnabled ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Enabled
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Not Enabled
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account by requiring a
              verification code from your authenticator app.
            </p>

            <div className="pt-4">
              {is2FAEnabled ? (
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBackupCodesModal(true);
                      setNewBackupCodes([]); // Reset view
                    }}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Manage Backup Codes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={loading}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Disable 2FA
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsSettingUp(true)}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Linked Accounts Section */}
      <Card className="p-6">
        <LinkedAccountsSettings />
      </Card>

      {/* Password Section */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400">
            <Key className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure.
            </p>
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPasswordModal(true)}
              >
                Update Password
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Sessions Section */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-semibold">Active Sessions</h3>
            <p className="text-sm text-muted-foreground">
              Manage devices where you are currently logged in.
            </p>
          </div>
        </div>
        <SessionList />
      </Card>

      {/* MODAL: Manage Backup Codes */}
      <Modal
        open={showBackupCodesModal}
        onOpenChange={setShowBackupCodesModal}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Backup Codes</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBackupCodesModal(false)}
            >
              Close
            </Button>
          </div>

          {!newBackupCodes.length ? (
            // State: View status / Init regenerate
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {backupCodesCount} codes remaining
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    You can use these codes to login if you lose access to your
                    authenticator app.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setShowRegenerateConfirm(true)}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Backup Codes
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Regenerating will invalidate all existing backup codes.
                </p>
              </div>
            </div>
          ) : (
            // State: Show New Codes
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-medium">New Codes Generated!</h3>
                <p className="text-sm text-muted-foreground">
                  Save these codes now. They will not be shown again.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border font-mono text-sm">
                {newBackupCodes.map((code, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-400 select-none mr-1">
                      {index + 1}.
                    </span>
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={downloadBackupCodes}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" /> Download & Copy
                </Button>
                <Button
                  onClick={() => {
                    setNewBackupCodes([]);
                    setShowBackupCodesModal(false);
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL: Confirm Regenerate */}
      <Modal
        open={showRegenerateConfirm}
        onOpenChange={setShowRegenerateConfirm}
        size="sm"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Confirm Regeneration</h3>
          <p className="text-sm text-muted-foreground">
            This will invalidate all your current backup codes. Please enter
            your password to confirm.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              placeholder="Enter your password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowRegenerateConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRegenerateCodes}
              disabled={regenerating || !passwordConfirm}
            >
              {regenerating ? "Regenerating..." : "Confirm & Regenerate"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Change Password */}
      <Modal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        size="sm"
      >
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <p className="text-sm text-muted-foreground">
            Enter your current password and a new one to update.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwords.current}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, current: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwords.new}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, new: e.target.value }))
              }
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={passwordUpdating}
              disabled={
                !passwords.current || !passwords.new || !passwords.confirm
              }
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
