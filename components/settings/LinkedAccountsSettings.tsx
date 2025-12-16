"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { Chrome, Github, Unlink, Link2, Loader2 } from "lucide-react";

type LinkedAccount = {
  id: string;
  provider: string;
  providerId: string;
  linkedAt: string;
};

const PROVIDERS = [
  {
    id: "google",
    name: "Google",
    icon: Chrome,
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-800",
  },
  {
    id: "discord",
    name: "Discord",
    icon: () => (
      <svg
        className="w-5 h-5"
        viewBox="0 0 127.14 96.36"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.29-23.25-5.67-51.55-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
      </svg>
    ),
    color: "text-[#5865F2]",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
  },
];

export function LinkedAccountsSettings() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      // Fetch linked accounts
      const accountsRes = await fetch("/api/auth/linked-accounts", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.data || []);
      }

      // Fetch user status to check if they have a password
      const statusRes = await fetch("/api/auth/user/status", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setHasPassword(statusData.data?.hasPassword || false);
      }
    } catch (e) {
      console.error("Failed to fetch linked accounts:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = (provider: string) => {
    // Use NextAuth signIn with redirect to link the account
    signIn(provider, { callbackUrl: "/settings?tab=security" });
  };

  const handleUnlink = async (provider: string) => {
    // Safety check: don't unlink last auth method without password
    if (accounts.length <= 1 && !hasPassword) {
      showToast(
        "Cannot unlink last authentication method. Set a password first.",
        "error"
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to unlink your ${provider} account? You won't be able to sign in with this account anymore.`
      )
    ) {
      return;
    }

    setUnlinking(provider);
    try {
      const res = await fetch(
        `/api/auth/linked-accounts?provider=${provider}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unlink account");
      }

      setAccounts((prev) => prev.filter((a) => a.provider !== provider));
      showToast(`${provider} account unlinked successfully`, "success");
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setUnlinking(null);
    }
  };

  const isLinked = (providerId: string) => {
    return accounts.some((a) => a.provider === providerId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-4">
        <h3 className="text-lg font-semibold">Connected Accounts</h3>
        <p className="text-sm text-muted-foreground">
          Link your social accounts for easier sign-in.
        </p>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const linked = isLinked(provider.id);
          const account = accounts.find((a) => a.provider === provider.id);
          const Icon = provider.icon;

          return (
            <Card
              key={provider.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${provider.bgColor}`}>
                  <Icon className={`w-5 h-5 ${provider.color}`} />
                </div>
                <div>
                  <p className="font-medium">{provider.name}</p>
                  {linked && account ? (
                    <p className="text-xs text-muted-foreground">
                      Linked {new Date(account.linkedAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not linked</p>
                  )}
                </div>
              </div>

              {linked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink(provider.id)}
                  disabled={unlinking === provider.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {unlinking === provider.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Unlink className="w-4 h-4 mr-1" />
                      Unlink
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLink(provider.id)}
                >
                  <Link2 className="w-4 h-4 mr-1" />
                  Link
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {!hasPassword && accounts.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Tip:</strong> Set a password to ensure you can always access
            your account, even if you unlink all social accounts.
          </p>
        </div>
      )}
    </div>
  );
}
