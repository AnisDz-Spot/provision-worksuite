"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * Tenant Provider - STUB
 * Multi-tenancy functionality removed as part of Firebase cleanup.
 * This is a placeholder for future multi-tenant implementation.
 */

interface TenantContextType {
  tenantId: string;
  loading: boolean;
  error: Error | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const value: TenantContextType = {
    tenantId: "default",
    loading: false,
    error: null,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
