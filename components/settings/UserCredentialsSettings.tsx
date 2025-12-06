"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useAuth, updateUserCredentials } from "@/components/auth/AuthContext";

export function UserCredentialsSettings() {
  const { currentUser } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); // Note: often not needed for simple updates if not checking old pwd, but keeping for completeness if API required it. Based on existing code, it wasn't strictly used in the logic shown, but I'll keep the state.
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [credentialsError, setCredentialsError] = useState("");
  const [credentialsSuccess, setCredentialsSuccess] = useState("");
  const [savingCredentials, setSavingCredentials] = useState(false);

  function handleUpdateCredentials(e: React.FormEvent) {
    e.preventDefault();
    setCredentialsError("");
    setCredentialsSuccess("");

    if (!currentUser) {
      setCredentialsError("Not authenticated");
      return;
    }

    // Validate passwords match
    if (newPassword && newPassword !== confirmPassword) {
      setCredentialsError("Passwords do not match");
      return;
    }

    // Validate password length
    if (newPassword && newPassword.length < 6) {
      setCredentialsError("Password must be at least 6 characters");
      return;
    }

    setSavingCredentials(true);

    const success = updateUserCredentials(
      currentUser.id,
      newEmail || undefined,
      newPassword || undefined
    );

    if (success) {
      setCredentialsSuccess("Credentials updated successfully");
      setNewEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setCredentialsError("Failed to update credentials");
    }

    setSavingCredentials(false);
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Login Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">
              Current Email
            </label>
            <Input
              type="text"
              value={currentUser?.email || ""}
              disabled
              className="bg-secondary"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">
              New Email (optional)
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">Change Password</h4>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          {credentialsError && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {credentialsError}
            </div>
          )}

          {credentialsSuccess && (
            <div className="p-3 rounded bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm">
              {credentialsSuccess}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={savingCredentials || (!newEmail && !newPassword)}
            loading={savingCredentials}
          >
            Update Credentials
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
