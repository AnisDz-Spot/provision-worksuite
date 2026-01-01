"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  isLoading: boolean;
  message: string | null;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showLoader = (msg?: string) => {
    setMessage(msg || null);
    setIsLoading(true);
  };

  const hideLoader = () => {
    setIsLoading(false);
    setMessage(null);
  };

  return (
    <LoadingContext.Provider
      value={{ isLoading, message, showLoader, hideLoader }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
