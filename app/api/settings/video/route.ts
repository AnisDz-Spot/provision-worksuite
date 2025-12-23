import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "Administrator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        settingKey: {
          in: ["zego_app_id", "zego_server_secret"],
        },
      },
    });

    const config = {
      appId:
        settings.find((s: any) => s.settingKey === "zego_app_id")
          ?.settingValue || "",
      serverSecret:
        settings.find((s: any) => s.settingKey === "zego_server_secret")
          ?.settingValue || "",
    };

    // Mask secret for safety
    if (config.serverSecret) {
      config.serverSecret =
        config.serverSecret.substring(0, 4) +
        "****" +
        config.serverSecret.substring(config.serverSecret.length - 4);
    }

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "Administrator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { appId, serverSecret } = await request.json();

    if (appId !== undefined) {
      await prisma.systemSetting.upsert({
        where: { settingKey: "zego_app_id" },
        update: {
          settingValue: String(appId),
          updatedAt: new Date(),
          updatedBy: user.email,
        },
        create: {
          settingKey: "zego_app_id",
          settingValue: String(appId),
          updatedBy: user.email,
        },
      });
    }

    if (serverSecret !== undefined && !serverSecret.includes("****")) {
      await prisma.systemSetting.upsert({
        where: { settingKey: "zego_server_secret" },
        update: {
          settingValue: serverSecret,
          updatedAt: new Date(),
          updatedBy: user.email,
        },
        create: {
          settingKey: "zego_server_secret",
          settingValue: serverSecret,
          updatedBy: user.email,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "Administrator") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.systemSetting.deleteMany({
      where: {
        settingKey: {
          in: ["zego_app_id", "zego_server_secret"],
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
