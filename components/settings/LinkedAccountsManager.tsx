"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToaster } from "@/components/ui/Toaster";
import { signIn } from "next-auth/react";
import { Link2, Unlink, Chrome, Github, Building2 } from "lucide-react";
import { fetchWithCsrf } from "@/lib/csrf-client";

interface LinkedAccount {
  id: string;
  provider: string;
  providerId: string;
  linkedAt: string;
}

const PROVIDERS = [
  { id: "google", name: "Google", icon: Chrome },
  { id: "github", name: "GitHub", icon: Github },
  { id: "microsoft-entra-id", name: "Microsoft", icon: Building2 },
];

export function LinkedAccountsManager() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { show } = useToaster();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/auth/linked-accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error("Failed to load linked accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const linkAccount = (provider: string) => {
    // This will redirect to OAuth flow and link on callback
    signIn(provider, { callbackUrl: window.location.href });
  };

  const unlinkAccount = async (provider: string) => {
    if (!confirm(`Unlink ${provider} account?`)) return;

    try {
      const res = await fetchWithCsrf(
        `/api/auth/linked-accounts?provider=${provider}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();

      if (data.success) {
        show("success", "Account unlinked");
        loadAccounts();
      } else {
        show("error", data.error || "Failed to unlink");
      }
    } catch (error) {
      show("error", "Network error");
    }
  };

  const isLinked = (providerId: string) => {
    return accounts.some((acc) => acc.provider === providerId);
  };

  if (loading) {
    return <Card className="p-6 animate-pulse h-32" />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Linked Accounts</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Link additional sign-in methods to your account for easier access.
      </p>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const linked = isLinked(provider.id);
          const Icon = provider.icon;

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium">{provider.name}</p>
                  {linked && (
                    <p className="text-xs text-muted-foreground">
                      Linked{" "}
                      {new Date(
                        accounts.find((a) => a.provider === provider.id)
                          ?.linkedAt || ""
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {linked ? (
                  <>
                    <Badge variant="success" pill>
                      Connected
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unlinkAccount(provider.id)}
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => linkAccount(provider.id)}
                  >
                    <Link2 className="w-4 h-4 mr-1" />
                    Link
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
