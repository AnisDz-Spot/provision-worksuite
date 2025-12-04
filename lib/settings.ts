export const LS_KEY_USER = "pv:user-settings";
export const LS_KEY_WORKSPACE = "pv:workspace-settings";

export interface UserSettingsData {
  fullName: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
  avatarDataUrl?: string;
}

export interface WorkspaceSettingsData {
  name: string;
  logoDataUrl?: string;
  tagline: string;
  website: string;
  timezone: string;
  primaryColor: string; // hex
}

export function loadUserSettings(): UserSettingsData | null {
  try {
    const raw = localStorage.getItem(LS_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserSettings(data: UserSettingsData) {
  try {
    localStorage.setItem(LS_KEY_USER, JSON.stringify(data));
  } catch {}
}

export function loadWorkspaceSettings(): WorkspaceSettingsData | null {
  try {
    const raw = localStorage.getItem(LS_KEY_WORKSPACE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export interface WorkspaceSaveResult {
  saved: boolean;
  truncatedLogo: boolean;
  error?: string;
}

export function saveWorkspaceSettings(
  data: WorkspaceSettingsData
): WorkspaceSaveResult {
  try {
    localStorage.setItem(LS_KEY_WORKSPACE, JSON.stringify(data));
    return { saved: true, truncatedLogo: false };
  } catch (e: any) {
    // Possible quota exceeded due to large data URL for logo
    if (
      typeof e === "object" &&
      e &&
      (e.name === "QuotaExceededError" || e.code === 22)
    ) {
      // attempt retry without logo
      const slim: WorkspaceSettingsData = { ...data, logoDataUrl: undefined };
      try {
        localStorage.setItem(LS_KEY_WORKSPACE, JSON.stringify(slim));
        return {
          saved: true,
          truncatedLogo: true,
          error: "Logo too large; not saved.",
        };
      } catch (inner: any) {
        return {
          saved: false,
          truncatedLogo: true,
          error: inner?.message || "Quota exceeded.",
        };
      }
    }
    return {
      saved: false,
      truncatedLogo: false,
      error: (e && e.message) || "Unknown error",
    };
  }
}

export function computeForeground(hex: string): string {
  // Choose foreground (black/white) based on WCAG contrast ratio
  // Strip # and expand shorthand
  let h = hex.replace(/^#/, "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const srgbToLin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const R = srgbToLin(r);
  const G = srgbToLin(g);
  const B = srgbToLin(b);
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B; // relative luminance

  // For dark/saturated colors (low luminance), white text has better contrast
  // For light/bright colors (high luminance), black text has better contrast
  // Use a threshold approach: if luminance < 0.5, use white, else black
  return L < 0.5 ? "#ffffff" : "#000000";
}
