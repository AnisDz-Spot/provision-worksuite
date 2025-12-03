"use client";
import { useState, useEffect } from "react";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <div className="inline-flex items-center gap-3 p-1 rounded-full bg-accent/40 border border-border">
      <button
        onClick={() => setTheme("light")}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
          !isDark
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Light mode"
      >
        <SunIcon width={16} height={16} />
        <span className="text-xs font-medium">Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
          isDark
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Dark mode"
      >
        <MoonIcon width={16} height={16} />
        <span className="text-xs font-medium">Dark</span>
      </button>
    </div>
  );
}
