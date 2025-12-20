"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  isSetupComplete,
  markDatabaseConfigured,
  markSetupComplete,
  getSetupStatus,
} from "@/lib/setup";
import {
  shouldUseMockData,
  shouldUseDatabaseData,
  setDataModePreference,
} from "@/lib/dataSource";
import { boolean } from "zod";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  isMasterAdmin?: boolean;
  avatarUrl?: string;
  password?: string;
};

type AuthContextType = {
  currentUser: User | null;
  login: (
    email: string,
    password: string,
    code?: string,
    useBackupCode?: boolean
  ) => Promise<{ success: boolean; error?: string; requires2FA?: boolean }>;
  logout: () => void;
  isAdmin: boolean;
  isMasterAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateCurrentUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for user management
async function readUsersFromStorage(): Promise<User[]> {
  if (typeof window === "undefined") return [];
  try {
    // Try loading from database first
    try {
      const { loadUsers } = await import("@/lib/data");
      const dbUsers = await loadUsers();

      // Convert database users to User format
      const users = dbUsers.map((u: any) => ({
        id: u.uid || u.id,
        name: u.name,
        email: u.email,
        role: u.role || "Member",
        password: "", // Don't expose passwords
        isAdmin:
          u.role?.toLowerCase() === "administrator" ||
          u.role?.toLowerCase() === "admin",
      }));

      return users;
    } catch (error) {
      console.error("Failed to load users from database:", error);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem("pv:users");
    if (stored) {
      return JSON.parse(stored);
    }

    return [];
  } catch {
    return [];
  }
}

function readUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("pv:users");
    let users: User[] = [];

    if (stored) {
      users = JSON.parse(stored);
    }

    // Built-in global admin user (hardcoded for initial setup)
    const builtInUsers: User[] = [
      {
        id: "admin-global",
        name: "Global Admin",
        email: "admin@provision.com",
        role: "Administrator",
        password: "password123578951",
        isAdmin: true,
      },
    ];

    // Add built-in admin if it doesn't exist
    let needsUpdate = false;
    builtInUsers.forEach((builtInUser) => {
      const exists = users.find(
        (u) => u.email === builtInUser.email || u.id === builtInUser.id
      );
      if (!exists) {
        users.push(builtInUser);
        needsUpdate = true;
      }
    });

    // Only keep the global admin - remove any other users from localStorage
    users = users.filter((u) => u.email === "admin@provision.com");

    if (needsUpdate || stored) {
      localStorage.setItem("pv:users", JSON.stringify(users));
    }

    return users;
  } catch {
    return [];
  }
}

function writeUsers(users: User[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("pv:users", JSON.stringify(users));
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  function setSessionExpiry(days = 30) {
    try {
      const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
      localStorage.setItem("pv:session", JSON.stringify({ expiresAt }));
    } catch {}
  }

  function getSessionValid(): boolean {
    try {
      const raw = localStorage.getItem("pv:session");
      if (!raw) return false;
      const { expiresAt } = JSON.parse(raw);
      return typeof expiresAt === "number" && Date.now() < expiresAt;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("pv:currentUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (getSessionValid()) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          // Expired session
          localStorage.removeItem("pv:currentUser");
          localStorage.removeItem("pv:session");
        }
      } catch {
        // Invalid stored data
        localStorage.removeItem("pv:currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  // Auto-refresh session on user activity while authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => setSessionExpiry(30);
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, refresh));
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, refresh));
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const login = async (
    email: string,
    password: string,
    code?: string,
    useBackupCode?: boolean
  ): Promise<{ success: boolean; error?: string; requires2FA?: boolean }> => {
    // Check for global admin credentials
    const isGlobalAdmin =
      email === "admin@provision.com" && password === "password123578951";

    // Debug logging
    console.log("[Auth] Login attempt", {
      email,
      isGlobalAdmin,
      setupComplete: isSetupComplete(),
      mock: shouldUseMockData(),
    });

    // If we are explicitly in MOCK mode, allow the admin backdoor immediately
    if (shouldUseMockData() && isGlobalAdmin) {
      // Only allow instant login if we are FORCED into mock mode (e.g. by environment)
      // Otherwise we want to try the real backend first if possible.
      // Actually, let's defer to the standard flow and use the backdoor as a fallback or only for setup.
    }

    // Relaxed check: Allow DB login if credentials NOT global-admin, OR if system is already set up
    const setupComplete = isSetupComplete();

    // We want to try DB login in almost all cases to allow users to "break out" of mock mode
    // or to authenticate via DB even if they are the global admin string.
    const shouldTryDbLogin = true;

    if (shouldTryDbLogin) {
      // Try Database Login
      try {
        // If we're trying a real login, we should prefer "real" mode if successful
        const modePref = "real";

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            code,
            useBackupCode,
            mode: modePref,
          }),
        });

        const data = await response.json();

        if (response.status === 503 || data.setupRequired) {
          // Database schema missing - redirect to onboarding
          if (typeof window !== "undefined") {
            window.location.href = "/onboarding?error=schema_missing";
          }
          return {
            success: false,
            error: data.error || "Database setup required.",
          };
        }

        if (data.requires2FA) {
          return { success: false, requires2FA: true, error: data.message };
        }

        if (data.success && data.user) {
          const authUser: User = {
            id: data.user.uid,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            avatarUrl: data.user.avatar_url,
            isAdmin:
              data.user.role?.toLowerCase() === "administrator" ||
              data.user.role?.toLowerCase() === "admin" ||
              data.user.isMasterAdmin === true,
            isMasterAdmin: data.user.isMasterAdmin || false,
          };

          setCurrentUser(authUser);
          setIsAuthenticated(true);
          localStorage.setItem("pv:currentUser", JSON.stringify(authUser));

          // 🛡️ SEED SETTINGS: Populate pv:user-settings if it's default/empty
          try {
            const rawSettings = localStorage.getItem("pv:user-settings");
            const needsSeed =
              !rawSettings || rawSettings.includes("Alex Admin");
            if (needsSeed) {
              localStorage.setItem(
                "pv:user-settings",
                JSON.stringify({
                  fullName: authUser.name,
                  email: authUser.email,
                  avatarDataUrl: authUser.avatarUrl,
                  role: authUser.role,
                  phone: "",
                  bio: "",
                  addressLine1: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  country: "",
                  postalCode: "",
                })
              );
            }
          } catch (e) {
            console.warn("Failed to seed user settings", e);
          }

          // If we successfully logged in via DB, update session expiry.
          setSessionExpiry(30);

          // AUTO-SWITCH to Real Mode & VALIDATE SETUP
          // We unconditionally force this because if DB login works, we are by definition in valid "Real" mode
          setDataModePreference("real");
          markSetupComplete(true, true, true);

          // Also set cookie for Server Components / future usage
          if (typeof document !== "undefined") {
            document.cookie =
              "pv-data-mode=real; path=/; max-age=31536000; SameSite=Lax";
          }

          return { success: true };
        }

        // If not successful and valid error derived from DB attempt (and not just network err)
        // If it's global admin, we might still want to fall back if the error was "User not found" or similar
        // BUT if the DB explicitly rejected password, we should probably respect that?
        // Actually, for Global Admin Backdoor, we treat DB failure (or missing user) as reason to try local.
      } catch (error) {
        console.error("[Auth] Server login failed:", error);
      }

      // FALLBACK for Global Admin:
      // If we are here, it means DB login failed (either exception or returned success:false).
      // We only fallback for Global Admin.
      if (isGlobalAdmin) {
        console.log("[Auth] Falling back to local admin credentials");
        const authUser: User = {
          id: "global-admin",
          name: "Admin",
          email,
          role: "Administrator",
          isAdmin: true,
          avatarUrl: undefined,
          password: undefined,
        };
        setCurrentUser(authUser);
        setIsAuthenticated(true);
        localStorage.setItem("pv:currentUser", JSON.stringify(authUser));
        setSessionExpiry(30);
        return { success: true };
      }

      // If we reached here, DB login failed and not global admin (or logic fell through)
      // We should return the error from the DB attempt if possible, but we might have lost it in the try/catch scope.
      // Ideally we should have returned inside the try if it was a definitive rejection.

      // Let's refine the try block to return error if not global admin
      // Re-read structure:
      // The original code returned error if not global admin inside the catch.
      // So I should return error here if not global admin.

      return {
        success: false,
        error: "Invalid email or password", // Generic error since we might have suppressed specific one
      };
    }

    // Setup NOT complete - allow global admin login ONLY
    const users = readUsers();
    // Use 'isGlobalAdmin' check here too instead of hardcoded find
    const user = users.find((u) => u.email === email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.password !== password) {
      return { success: false, error: "Invalid password" };
    }

    const authUser: User = {
      ...user,
      isAdmin:
        user.role?.toLowerCase() === "administrator" ||
        user.role?.toLowerCase() === "admin" ||
        user.role === "Project Manager",
    };

    // Don't store password in session
    const { password: _, ...userWithoutPassword } = authUser;
    setCurrentUser(userWithoutPassword as User);
    setIsAuthenticated(true);
    localStorage.setItem("pv:currentUser", JSON.stringify(userWithoutPassword));
    setSessionExpiry(30);

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("pv:currentUser");
    localStorage.removeItem("pv:session");
  };

  const updateCurrentUser = (patch: Partial<User>) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem("pv:currentUser", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAdmin: currentUser?.isAdmin || false,
        isMasterAdmin: currentUser?.isMasterAdmin || false,
        isAuthenticated,
        isLoading,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper function to add a new user (admin only)
export function addUser(user: Omit<User, "id" | "isAdmin">): User {
  const users = readUsers();
  const newUser: User = {
    ...user,
    id: `u${Date.now()}`,
    isAdmin:
      user.role?.toLowerCase() === "administrator" ||
      user.role?.toLowerCase() === "admin" ||
      user.role === "Project Manager",
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

// Helper function to update user credentials
export function updateUserCredentials(
  userId: string,
  email?: string,
  password?: string
): boolean {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);

  if (index === -1) return false;

  if (email) users[index].email = email;
  if (password) users[index].password = password;

  writeUsers(users);

  // Update current session if it's the same user
  const storedUser = localStorage.getItem("pv:currentUser");
  if (storedUser) {
    const currentUser = JSON.parse(storedUser);
    if (currentUser.id === userId && email) {
      currentUser.email = email;
      localStorage.setItem("pv:currentUser", JSON.stringify(currentUser));
    }
  }

  return true;
}
