"use client";

import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { ThemePresets } from "@/components/settings/ThemePresets";

export function AppearanceSettings() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Theme Mode</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Toggle light/dark mode.
        </p>
        <ThemeSwitcher />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Color Presets</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Pick a primary color. This updates the app accent.
        </p>
        <ThemePresets />
      </div>
    </div>
  );
}
