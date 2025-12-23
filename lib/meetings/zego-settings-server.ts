import prisma from "@/lib/prisma";

export async function getZegoSystemSettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        settingKey: {
          in: ["zego_app_id", "zego_server_secret"],
        },
      },
    });

    const appIdStr = settings.find(
      (s: any) => s.settingKey === "zego_app_id"
    )?.settingValue;
    const serverSecret = settings.find(
      (s: any) => s.settingKey === "zego_server_secret"
    )?.settingValue;

    return {
      appId: appIdStr ? Number(appIdStr) : null,
      serverSecret: serverSecret || null,
    };
  } catch (error) {
    console.error("Failed to fetch Zego system settings:", error);
    return { appId: null, serverSecret: null };
  }
}
