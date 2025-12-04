"use client";
import React, { createContext, useContext, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ToastContextProps {
  show: (type: Toast["type"], message: string) => void;
}

const ToastContext = createContext<ToastContextProps>({
  show: () => {},
});

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const timers = useRef<{ [id: string]: any }>({});

  const show = (type: Toast["type"], message: string) => {
    const id = Math.random().toString(36).slice(2, 10);
    setList((q) => [...q, { id, type, message }]);
    timers.current[id] = setTimeout(() => {
      setList((q) => q.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 3400);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed z-[999] right-4 top-4 flex flex-col gap-2">
        {list.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-2 rounded shadow-lg flex items-center gap-2 border text-sm animate-fadeIn",
              toast.type === "success" && "bg-green-100 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700",
              toast.type === "error" && "bg-destructive text-white border-destructive dark:bg-red-900 dark:border-red-700",
              toast.type === "info" && "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-700",
              toast.type === "warning" && "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-700"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToaster() {
  return useContext(ToastContext);
}


