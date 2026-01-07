import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user ID from database
    const dbUser = await prisma.user.findUnique({
      where: { uid: user.uid },
      select: { id: true, name: true, email: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get digest settings
    const settings = await prisma.digestSettings.findUnique({
      where: { userId: dbUser.id },
    });

    if (!settings || settings.recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients configured" },
        { status: 400 }
      );
    }

    // Get digest content from request body
    const body = await req.json();
    const { htmlContent, weekRange, summary } = body;

    if (!htmlContent) {
      return NextResponse.json(
        { success: false, error: "No digest content provided" },
        { status: 400 }
      );
    }

    // Send email to all recipients
    const subject = `Weekly Project Digest - ${weekRange}`;
    const emailPromises = settings.recipients.map((recipient: string) =>
      sendEmail({
        to: recipient,
        subject,
        text: `Weekly Project Digest for ${weekRange}\n\nView the full digest in HTML email.`,
        html: htmlContent,
      })
    );

    const results = await Promise.allSettled(emailPromises);

    // Check if all emails were sent successfully
    const failures = results.filter(
      (r) =>
        r.status === "rejected" ||
        (r.status === "fulfilled" && !r.value.success)
    );

    const previewUrls = results
      .map((r) => r.status === "fulfilled" && r.value.previewUrl)
      .filter(Boolean) as string[];

    if (failures.length === results.length) {
      // All failed
      return NextResponse.json(
        { success: false, error: "Failed to send digest to any recipients" },
        { status: 500 }
      );
    }

    if (failures.length > 0) {
      // Some failed
      return NextResponse.json({
        success: true,
        warning: `Sent to ${results.length - failures.length} of ${results.length} recipients`,
        recipients: settings.recipients.length,
        previewUrls: previewUrls.length > 0 ? previewUrls : undefined,
      });
    }

    // All succeeded
    return NextResponse.json({
      success: true,
      message: "Digest sent successfully",
      recipients: settings.recipients.length,
      previewUrls: previewUrls.length > 0 ? previewUrls : undefined,
    });
  } catch (error: any) {
    console.error("Error sending digest:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send digest" },
      { status: 500 }
    );
  }
}
