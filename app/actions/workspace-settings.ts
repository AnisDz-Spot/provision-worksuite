"use server";

import prisma from "@/lib/prisma";
import { WorkspaceSettingsData } from "@/lib/settings";
import { revalidatePath } from "next/cache";

const SETTING_KEY = "workspace_profile";

export async function getWorkspaceSettingsAction(): Promise<WorkspaceSettingsData | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: SETTING_KEY },
    });

    if (!setting) return null;

    return JSON.parse(setting.settingValue) as WorkspaceSettingsData;
  } catch (error) {
    console.error("Failed to fetch workspace settings:", error);
    return null;
  }
}

export async function saveWorkspaceSettingsAction(
  data: WorkspaceSettingsData
): Promise<{ success: boolean; error?: string }> {
  try {
    const value = JSON.stringify(data);

    await prisma.systemSetting.upsert({
      where: { settingKey: SETTING_KEY },
      update: {
        settingValue: value,
        updatedAt: new Date(),
        updatedBy: "system", // TODO: Replace with actual user ID from session when available
      },
      create: {
        settingKey: SETTING_KEY,
        settingValue: value,
        isEncrypted: false,
        updatedBy: "system",
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save workspace settings:", error);
    return { success: false, error: error.message };
  }
}
