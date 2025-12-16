/**
 * Custom Auth Hook - JWT Authentication
 * Replaces Firebase Auth with custom JWT-based authentication
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  avatarUrl?: string;
}

interface UseAuthState {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
}

export function useAuthState(): [AuthUser | null, boolean, Error | null] {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for authentication on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        setState({ user, loading: false, error: null });
      } else {
        setState({ user: null, loading: false, error: null });
      }
    } catch (error) {
      setState({
        user: null,
        loading: false,
        error: error as Error,
      });
    }
  };

  return [state.user, state.loading, state.error];
}

/**
 * Sign in with email and password
 */
export async function signInWithEmailAndPassword(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return { user: data.user, error: null };
    } else {
      const data = await response.json();
      return { user: null, error: data.error || "Login failed" };
    }
  } catch (error) {
    return { user: null, error: "Network error" };
  }
}

/**
 * Sign up with email and password
 */
export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
  name: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, name }),
    });

    if (response.ok) {
      const data = await response.json();
      return { user: data.user, error: null };
    } else {
      const data = await response.json();
      return { user: null, error: data.error || "Registration failed" };
    }
  } catch (error) {
    return { user: null, error: "Network error" };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    // Reload to clear state
    window.location.href = "/auth/login";
  } catch (error) {
    console.error("Sign out error:", error);
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      return { success: true, error: null };
    } else {
      const data = await response.json();
      return {
        success: false,
        error: data.error || "Failed to send reset email",
      };
    }
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}
