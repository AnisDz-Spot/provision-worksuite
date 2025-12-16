"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAuthState, AuthUser } from "@/lib/hooks/useAuth";

interface AuthContextType {
  user: AuthUser | null | undefined;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      // Map authenticated user to UserProfile
      setCurrentUser({
        id: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        avatar:
          user.avatarUrl ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
      });
    } else {
      setCurrentUser(null);
    }
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


