"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
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
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for user management
function readUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("pv:users");
    let users: User[] = [];

    if (stored) {
      users = JSON.parse(stored);
    }

    // Built-in users that should always exist
    const builtInUsers: User[] = [
      {
        id: "u1",
        name: "Alice",
        email: "alice@provision.com",
        role: "Project Manager",
        password: "password123",
        isAdmin: true,
      },
      {
        id: "u2",
        name: "Anis Dzed",
        email: "anisdzed@gmail.com",
        role: "Developer",
        password: "1223221223221",
        isAdmin: false,
      },
    ];

    // Add built-in users if they don't exist
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

    // If no users at all, also add users from JSON (excluding built-in users)
    if (!stored) {
      try {
        const jsonUsers = require("@/data/users.json")
          .filter(
            (u: any) =>
              !builtInUsers.some((bu) => bu.email === u.email || bu.id === u.id)
          )
          .map((u: any) => ({
            ...u,
            password: "password123",
            isAdmin: u.role === "Project Manager",
          }));
        users.push(...jsonUsers);
        needsUpdate = true;
      } catch {
        // users.json may not exist
      }
    }

    if (needsUpdate) {
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

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("pv:currentUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch {
        // Invalid stored data
        localStorage.removeItem("pv:currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
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
      isAdmin: user.role === "Project Manager",
    };

    // Don't store password in session
    const { password: _, ...userWithoutPassword } = authUser;
    setCurrentUser(userWithoutPassword as User);
    setIsAuthenticated(true);
    localStorage.setItem("pv:currentUser", JSON.stringify(userWithoutPassword));

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("pv:currentUser");
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
