"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { isSetupComplete } from "@/lib/setup";
import { shouldUseMockData } from "@/lib/dataSource";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  avatarUrl?: string;
  password?: string;
};

type AuthContextType = {
  currentUser: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
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
        isAdmin: u.role === "Administrator",
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
        email: "anis@provision.com",
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
    users = users.filter((u) => u.email === "anis@provision.com");

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
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // If admin selected dummy data mode, check for fake admin login first
    if (shouldUseMockData()) {
      if (email === "anis@provision.com" && password === "password123578951") {
        const authUser: User = {
          id: "demo-admin",
          name: "Demo Admin",
          email,
          role: "Administrator",
          isAdmin: true,
        };
        setCurrentUser(authUser);
        setIsAuthenticated(true);
        localStorage.setItem("pv:currentUser", JSON.stringify(authUser));
        setSessionExpiry(30);
        return { success: true };
      }

      // If we are here, credentials didn't match the Demo Admin.
      // If the user hasn't EXPLICITLY set "mock" mode, we should try the database.
      // This handles fresh production deployments where localStorage is empty (so defaults to mock)
      // but the server is actually ready.
      const explicitMock =
        typeof window !== "undefined" &&
        localStorage.getItem("pv:dataMode") === "mock";

      if (!explicitMock) {
        // Fallthrough to try API login below
      } else {
        // In explicit dummy mode, reject other credentials
        return {
          success: false,
          error: "Use fake admin credentials in dummy data mode.",
        };
      }
    }

    // Check if setup is complete - if yes, ONLY allow database login
    // ... OR if we act "optimistically" because we fell through from above
    const setupComplete = isSetupComplete();

    // Try Database Login if setup is complete OR if we are in that implicit mock state (fallthrough)
    if (
      setupComplete ||
      !shouldUseMockData() ||
      (shouldUseMockData() &&
        typeof window !== "undefined" &&
        localStorage.getItem("pv:dataMode") !== "mock")
    ) {
      // Setup is complete - only allow database authentication
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success && data.user) {
          const authUser: User = {
            id: data.user.uid,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            isAdmin: data.user.role === "Administrator",
          };

          setCurrentUser(authUser);
          setIsAuthenticated(true);
          localStorage.setItem("pv:currentUser", JSON.stringify(authUser));
          // If we successfully logged in via DB but client thought we were in implicit mock mode,
          // update client state to "real" to prevent future confusion.
          if (!setupComplete) {
            localStorage.setItem("pv:dataMode", "real");
          }
          setSessionExpiry(30);

          return { success: true };
        } else {
          // If DB login failed, and we weren't strictly set up, don't return error yet?
          // No, proper error is better.
          return {
            success: false,
            error: data.error || "Invalid email or password",
          };
        }
      } catch (error) {
        // If API failed (e.g. 500 or 404), maybe we really ARE in mock mode without DB.
        // fallback to global admin logic below?
        // No, standard flow.
        return {
          success: false,
          error:
            "Unable to connect to database. Please check your configuration.",
        };
      }
    }

    // Setup NOT complete - allow global admin login ONLY
    const users = readUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.password !== password) {
      return { success: false, error: "Invalid password" };
    }

    const authUser: User = {
      ...user,
      isAdmin: user.role === "Administrator" || user.role === "Project Manager",
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
    isAdmin: user.role === "Project Manager",
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
