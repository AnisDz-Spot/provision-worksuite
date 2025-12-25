"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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
  updateUser: (data: UserSettingsData, options?: { silent?: boolean }) => void;
  updateWorkspace: (data: WorkspaceSettingsData) => void;
}

const defaultUser: UserSettingsData = {
  fullName: "Alex Admin",
  email: "alex@provision.com",
  phone: "",
  bio: "",
  role: "Administrator",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
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
    // Initial Load logic
    const mode =
      typeof window !== "undefined"
        ? localStorage.getItem("pv:dataMode")
        : "mock";

    if (mode === "real") {
      // Load from DB
      import("@/app/actions/workspace-settings").then(
        ({ getWorkspaceSettingsAction }) => {
          getWorkspaceSettingsAction().then((dbSettings) => {
            if (dbSettings) {
              setWorkspace((prev) => ({ ...prev, ...dbSettings }));
            }
          });
        }
      );
      // Attempt to load user settings from DB? (Current scope is workspace settings only for DB persistence yet)
      // For user settings, we might still be using local storage or need another action.
      // The user request specified workspace settings.
      const u = loadUserSettings();
      if (u) setUser({ ...defaultUser, ...u });
    } else {
      // Load from localStorage
      const u = loadUserSettings();
      if (u) setUser({ ...defaultUser, ...u });
      const w = loadWorkspaceSettings();
      if (w) setWorkspace({ ...defaultWorkspace, ...w });
    }
  }, []);

  useEffect(() => {
    // Apply theme color when workspace changes
    const root = document.documentElement;
    const fgColor = computeForeground(workspace.primaryColor);

    root.style.setProperty("--primary", workspace.primaryColor);
    root.style.setProperty("--sidebar-primary", workspace.primaryColor);
    root.style.setProperty("--primary-foreground", fgColor);
    root.style.setProperty("--sidebar-primary-foreground", fgColor);
  }, [workspace.primaryColor]);

  const updateUser = useCallback(
    (data: UserSettingsData, options?: { silent?: boolean }) => {
      setUser(data);
      saveUserSettings(data);
      if (!options?.silent) {
        showToast("Profile saved", "success");
      }
    },
    [showToast]
  );

  const updateWorkspace = useCallback(
    async (data: WorkspaceSettingsData) => {
      setWorkspace(data);

      const mode =
        typeof window !== "undefined"
          ? localStorage.getItem("pv:dataMode")
          : "mock";

      if (mode === "real") {
        // Save to DB
        const { saveWorkspaceSettingsAction } =
          await import("@/app/actions/workspace-settings");
        const res = await saveWorkspaceSettingsAction(data);
        if (res.success) {
          showToast("Workspace settings saved to database", "success");
        } else {
          showToast(res.error || "Failed to save to database", "error");
        }
      } else {
        // Save to localStorage
        const res: WorkspaceSaveResult = saveWorkspaceSettings(data);
        if (res.saved) {
          if (res.truncatedLogo) {
            showToast(res.error || "Logo omitted due to size", "warning");
          } else {
            showToast("Workspace settings saved locally", "success");
          }
        } else {
          showToast(res.error || "Failed to save workspace settings", "error");
        }
      }
    },
    [showToast]
  );

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
