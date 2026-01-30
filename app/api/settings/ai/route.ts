import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET: Retrieve AI settings (Admin only)
 * Masks the API key for security.
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        settingKey: {
          in: ["ai_provider", "ai_model", "ai_api_key", "ai_base_url"],
        },
      },
    });

    const data: any = {
      ai_provider: "",
      ai_model: "",
      ai_api_key: "",
      ai_base_url: "",
    };

    settings.forEach((s: any) => {
      let value = s.isEncrypted ? decrypt(s.settingValue) : s.settingValue;

      // Mask API key for the UI
      if (s.settingKey === "ai_api_key" && value) {
        if (value.length > 8) {
          data[s.settingKey] =
            value.substring(0, 4) +
            "****************" +
            value.substring(value.length - 4);
        } else {
          data[s.settingKey] = "****************";
        }
      } else {
        data[s.settingKey] = value;
      }
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching AI settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * POST: Update AI settings (Admin only)
 * Encrypts sensitive fields before storing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { provider, model, apiKey, baseUrl } = body;

    const updates = [
      { key: "ai_provider", value: provider, encrypted: false },
      { key: "ai_model", value: model, encrypted: false },
      { key: "ai_api_key", value: apiKey, encrypted: true },
      { key: "ai_base_url", value: baseUrl, encrypted: false },
    ];

    for (const update of updates) {
      if (update.value === undefined || update.value === null) continue;

      // If API key is masked (contains the UI mask pattern), skip update for this field
      if (
        update.key === "ai_api_key" &&
        (update.value === "" || update.value.includes("****************"))
      ) {
        continue;
      }

      const finalValue = update.encrypted
        ? encrypt(update.value)
        : update.value;

      await prisma.systemSetting.upsert({
        where: { settingKey: update.key },
        update: {
          settingValue: String(finalValue),
          isEncrypted: update.encrypted,
          updatedBy: user.email || "system",
        },
        create: {
          settingKey: update.key,
          settingValue: String(finalValue),
          isEncrypted: update.encrypted,
          updatedBy: user.email || "system",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "AI settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
