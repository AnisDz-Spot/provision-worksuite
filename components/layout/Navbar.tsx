"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, Building2, LogOut, Search } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Logo } from "@/components/ui/Logo";
import { useSettings } from "@/components/settings/SettingsProvider";
import { useAuth } from "@/components/auth/AuthContext";
import { updateMemberActivity } from "@/lib/utils";
import { shouldUseMockData, shouldUseDatabaseData } from "@/lib/dataSource";
import {
  CommandPalette,
  useCommandPalette,
} from "@/components/search/CommandPalette";
import { fetchWithCsrf } from "@/lib/csrf-client";

const routeLabels: { [key: string]: string } = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/team": "Team",
  "/calendar": "Calendar",
  "/settings": "Settings",
  "/auth/login": "Login",
  "/auth/register": "Register",
  "/auth/forgot": "Forgot Password",
};

export function Navbar({ canNavigate = true }: { canNavigate?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspace } = useSettings();
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isOpen, setIsOpen } = useCommandPalette();
  const segments = pathname?.split("/").filter(Boolean) || [];
  const last = segments.length > 0 ? segments[segments.length - 1] : "";
  const prettyLast = last
    ? last.charAt(0).toUpperCase() + last.slice(1)
    : "Dashboard";
  const currentRoute = routeLabels[pathname] || prettyLast || "Dashboard";
  // Demo banner only; no copy functionality in header

  // Track user activity on interaction (only if navigation is allowed)
  useEffect(() => {
    if (!currentUser || !canNavigate) return;

    const trackActivity = () => {
      if (currentUser.name) {
        updateMemberActivity({
          memberName: currentUser.name,
          lastActive: Date.now(),
          status: "online",
        });
      }
      // Send presence heartbeat only when DB is configured
      if (!shouldUseDatabaseData()) return;

      try {
        const status = localStorage.getItem("pv:presenceStatus") || "available";
        fetchWithCsrf("/api/presence/heartbeat", {
          method: "POST",
          body: JSON.stringify({ uid: currentUser.id, status }),
        }).catch(() => {});
      } catch {}
    };

    // Track on mount and on user interaction
    trackActivity();

    const events = ["mousedown", "keydown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, trackActivity));

    // Track every 30 seconds
    const interval = setInterval(trackActivity, 30000);

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, trackActivity)
      );
      clearInterval(interval);
    };
  }, [currentUser, canNavigate]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [profileOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/95 dark:bg-[#111743]/95 shadow-sm border-b h-16 flex items-center px-4 md:px-8 justify-between backdrop-blur-sm overflow-visible">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="font-semibold text-xl text-foreground truncate">
            {currentRoute}
          </span>
          {shouldUseMockData() && (
            <button
              className="ml-2 inline-flex items-center gap-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300 text-xs shrink-0 hover:bg-yellow-200 transition"
              title="Go to Data Source settings"
              onClick={() => router.push("/settings?tab=dataSource")}
            >
              Demo Mode
            </button>
          )}
          {workspace.tagline && (
            <div className="flex-1 min-w-0 max-w-md">
              <div className="overflow-x-auto scrollbar-hide">
                <span className="text-sm text-muted-foreground truncate block">
                  {workspace.tagline}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-6 justify-end min-w-0">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 px-3 md:px-4 py-2 rounded-lg border bg-background/50 hover:bg-accent transition-colors text-sm text-muted-foreground min-w-0 sm:min-w-[180px] justify-between shrink"
            title="Search (Ctrl+K)"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden md:inline truncate">Search</span>
            </div>
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted rounded">
              <span>Ctrl</span>
              <span>K</span>
            </kbd>
          </button>
          <NotificationBell />
          <div className="hidden md:block w-px h-6 bg-border" />
          <div className="relative" ref={profileRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen(!profileOpen);
              }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {currentUser?.avatarUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border"
                  onError={() => setImgError(true)}
                />
              ) : currentUser?.name ? (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {currentUser.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full overflow-hidden border">
                  <Logo className="w-full h-full" />
                </div>
              )}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 z-50 bg-popover border rounded-lg shadow-lg min-w-48 py-2 animate-fadeIn">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium">{currentUser?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                  onClick={() => setProfileOpen(false)}
                >
                  <Building2 className="w-4 h-4" />
                  Agency
                </Link>
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    router.push("/auth/login");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-destructive/20 text-destructive cursor-pointer text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
          <div className="hidden md:block w-px h-6 bg-border" />
          <ThemeSwitcher />
        </div>
      </header>
      <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
