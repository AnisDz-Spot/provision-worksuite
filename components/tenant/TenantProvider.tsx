"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore } from "firebase/firestore";
import { FirebaseStorage } from "firebase/storage";
import {
  getTenantId,
  setTenantId,
  initializeTenantFirebase,
  switchTenant,
} from "@/lib/firebase-multi-tenant";

interface TenantContextType {
  tenantId: string;
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  storage: FirebaseStorage | null;
  loading: boolean;
  error: Error | null;
  switchTenant: (newTenantId: string) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantIdState] = useState<string>("default");
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initializeTenant() {
      try {
        setLoading(true);
        setError(null);

        // Get tenant ID from URL/subdomain
        const currentTenantId = getTenantId();
        setTenantIdState(currentTenantId);

        // Initialize Firebase for this tenant
        const firebase = await initializeTenantFirebase(currentTenantId);

        if (!firebase) {
          throw new Error(
            `Failed to initialize Firebase for tenant: ${currentTenantId}`
          );
        }

        setApp(firebase.app);
        setAuth(firebase.auth);
        setDb(firebase.db);
        setStorage(firebase.storage);
      } catch (err) {
        console.error("Tenant initialization error:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    initializeTenant();
  }, []);

  const handleSwitchTenant = async (newTenantId: string) => {
    try {
      setLoading(true);
      setError(null);

      const firebase = await switchTenant(newTenantId);

      if (!firebase) {
        throw new Error(`Failed to switch to tenant: ${newTenantId}`);
      }

      setTenantIdState(newTenantId);
      setApp(firebase.app);
      setAuth(firebase.auth);
      setDb(firebase.db);
      setStorage(firebase.storage);

      // Reload the page to reset state
      window.location.reload();
    } catch (err) {
      console.error("Tenant switch error:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        app,
        auth,
        db,
        storage,
        loading,
        error,
        switchTenant: handleSwitchTenant,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
