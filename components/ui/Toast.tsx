"use client";
import * as React from "react";
import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback(
    (message: string, type: ToastType = "success") => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after 2 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 2000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-card border-2 rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md animate-in slide-in-from-right duration-300 flex items-start gap-3"
            style={{
              borderColor:
                toast.type === "success"
                  ? "rgb(34, 197, 94)"
                  : toast.type === "error"
                    ? "rgb(239, 68, 68)"
                    : toast.type === "warning"
                      ? "rgb(234, 179, 8)"
                      : "rgb(59, 130, 246)",
            }}
          >
            <div className="shrink-0">
              {toast.type === "success" && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {toast.type === "error" && (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              {toast.type === "warning" && (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 text-sm font-medium text-foreground">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
