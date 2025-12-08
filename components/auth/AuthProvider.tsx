"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: import("firebase/auth").User | null | undefined;
  loading: boolean;
  currentUser: UserProfile | null;
  isAdmin: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
  avatar: string;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  currentUser: null,
  isAdmin: false,
});

// Mock current user - in production this would come from Firebase/backend
const MOCK_CURRENT_USER: UserProfile = {
  id: "u1",
  name: "Alice",
  email: "alice@provision.com",
  role: "Project Manager",
  isAdmin: true, // Alice is admin
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // In production, fetch user profile from database based on auth user
    // For now, use mock data
    setCurrentUser(MOCK_CURRENT_USER);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        currentUser,
        isAdmin: currentUser?.isAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

