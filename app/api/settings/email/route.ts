import { NextResponse } from "next/server";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

// Force Node.js runtime to support node:crypto
export const runtime = "nodejs";

// GET - Fetch email settings (admin only)
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const settings = await prisma.emailSettings.findFirst();

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // Decrypt sensitive fields before sending
    const decrypted = {
      ...settings,
      smtpPassword: settings.smtpPassword
        ? decrypt(settings.smtpPassword)
        : null,
      sendgridApiKey: settings.sendgridApiKey
        ? decrypt(settings.sendgridApiKey)
        : null,
      mailgunApiKey: settings.mailgunApiKey
        ? decrypt(settings.mailgunApiKey)
        : null,
      resendApiKey: settings.resendApiKey
        ? decrypt(settings.resendApiKey)
        : null,
      postmarkApiKey: settings.postmarkApiKey
        ? decrypt(settings.postmarkApiKey)
        : null,
      brevoApiKey: settings.brevoApiKey ? decrypt(settings.brevoApiKey) : null,
      awsAccessKey: settings.awsAccessKey
        ? decrypt(settings.awsAccessKey)
        : null,
      awsSecretKey: settings.awsSecretKey
        ? decrypt(settings.awsSecretKey)
        : null,
      slackWebhookUrl: settings.slackWebhookUrl
        ? decrypt(settings.slackWebhookUrl)
        : null,
      teamsWebhookUrl: settings.teamsWebhookUrl
        ? decrypt(settings.teamsWebhookUrl)
        : null,
    };

    return NextResponse.json({
      success: true,
      data: decrypted,
    });
  } catch (error: any) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch email settings",
      },
      { status: 500 },
    );
  }
}

// POST - Save/update email settings (admin only)
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      provider,
      fromAddress,
      fromName,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      sendgridApiKey,
      mailgunApiKey,
      mailgunDomain,
      resendApiKey,
      postmarkApiKey,
      brevoApiKey,
      awsAccessKey,
      awsSecretKey,
      awsRegion,
      slackWebhookUrl,
      teamsWebhookUrl,
    } = body;

    // Validate required fields
    if (!provider || !fromAddress) {
      return NextResponse.json(
        { success: false, error: "Provider and from address are required" },
        { status: 400 },
      );
    }

    // Encrypt sensitive fields
    const encryptedData: any = {
      provider,
      fromAddress,
      fromName: fromName || null,
      smtpHost: smtpHost || null,
      smtpPort: smtpPort ? parseInt(String(smtpPort)) : null,
      smtpUser: smtpUser || null,
      smtpPassword: smtpPassword ? encrypt(smtpPassword) : null,
      smtpSecure: smtpSecure || false,
      sendgridApiKey: sendgridApiKey ? encrypt(sendgridApiKey) : null,
      mailgunApiKey: mailgunApiKey ? encrypt(mailgunApiKey) : null,
      mailgunDomain: mailgunDomain || null,
      resendApiKey: resendApiKey ? encrypt(resendApiKey) : null,
      postmarkApiKey: postmarkApiKey ? encrypt(postmarkApiKey) : null,
      brevoApiKey: brevoApiKey ? encrypt(brevoApiKey) : null,
      awsAccessKey: awsAccessKey ? encrypt(awsAccessKey) : null,
      awsSecretKey: awsSecretKey ? encrypt(awsSecretKey) : null,
      awsRegion: awsRegion || null,
      slackWebhookUrl: slackWebhookUrl ? encrypt(slackWebhookUrl) : null,
      teamsWebhookUrl: teamsWebhookUrl ? encrypt(teamsWebhookUrl) : null,
    };

    // Check if settings exist
    const existing = await prisma.emailSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: encryptedData,
      });
    } else {
      settings = await prisma.emailSettings.create({
        data: encryptedData,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("Error saving email settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save email settings",
      },
      { status: 500 },
    );
  }
}

// DELETE - Remove email settings (admin only)
export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const settings = await prisma.emailSettings.findFirst();

    if (settings) {
      await prisma.emailSettings.delete({
        where: { id: settings.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Email settings deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting email settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete email settings",
      },
      { status: 500 },
    );
  }
}
