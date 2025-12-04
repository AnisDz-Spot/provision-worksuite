"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  UserSettingsData,
  WorkspaceSettingsData,
  loadUserSettings,
  saveUserSettings,
  loadWorkspaceSettings,
  saveWorkspaceSettings,
  computeForeground,
  WorkspaceSaveResult,
} from "@/lib/settings";
import { useToast } from "@/components/ui/Toast";

interface SettingsContextValue {
  user: UserSettingsData;
  workspace: WorkspaceSettingsData;
  updateUser: (data: UserSettingsData) => void;
  updateWorkspace: (data: WorkspaceSettingsData) => void;
}

const defaultUser: UserSettingsData = {
  fullName: "Alex Admin",
  email: "alex@provision.com",
  phone: "",
  title: "Administrator",
  bio: "",
  avatarDataUrl: undefined,
};

const defaultWorkspace: WorkspaceSettingsData = {
  name: "ProVision WorkSuite",
  tagline: "Empowering teams to deliver.",
  website: "https://provision.example.com",
  timezone: "UTC",
  primaryColor: "#3b82f6",
  logoDataUrl: undefined,
};

const SettingsContext = createContext<SettingsContextValue>({
  user: defaultUser,
  workspace: defaultWorkspace,
  updateUser: () => {},
  updateWorkspace: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSettingsData>(defaultUser);
  const [workspace, setWorkspace] =
    useState<WorkspaceSettingsData>(defaultWorkspace);
  const { showToast } = useToast();

  useEffect(() => {
    // Load from localStorage on mount
    const u = loadUserSettings();
    if (u) setUser({ ...defaultUser, ...u });
    const w = loadWorkspaceSettings();
    if (w) setWorkspace({ ...defaultWorkspace, ...w });
  }, []);

  useEffect(() => {
    // Apply theme color when workspace changes
    const root = document.documentElement;
    const fgColor = computeForeground(workspace.primaryColor);

    root.style.setProperty("--primary", workspace.primaryColor);
    root.style.setProperty("--sidebar-primary", workspace.primaryColor);
    root.style.setProperty("--primary-foreground", fgColor);
    root.style.setProperty("--sidebar-primary-foreground", fgColor);

    // Debug: Log to verify values are being set
    console.log("Theme updated:", {
      primary: workspace.primaryColor,
      foreground: fgColor,
    });
  }, [workspace.primaryColor]);

  function updateUser(data: UserSettingsData) {
    setUser(data);
    saveUserSettings(data);
    showToast("Profile saved", "success");
  }

  function updateWorkspace(data: WorkspaceSettingsData) {
    setWorkspace(data);
    const res: WorkspaceSaveResult = saveWorkspaceSettings(data);
    if (res.saved) {
      if (res.truncatedLogo) {
        showToast(res.error || "Logo omitted due to size", "warning");
      } else {
        showToast("Workspace settings saved", "success");
      }
    } else {
      showToast(res.error || "Failed to save workspace settings", "error");
    }
  }

  return (
    <SettingsContext.Provider
      value={{ user, workspace, updateUser, updateWorkspace }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
