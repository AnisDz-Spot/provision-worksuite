// app/api/support/email/route.ts - Support Email Handler
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { subject, priority, message, to } = await request.json();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error("SMTP credentials not configured");
      return NextResponse.json(
        {
          error: "Email service not configured. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    console.log("Attempting to send email to:", to || "anisdzed@gmail.com");
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      // Don't log password
    });

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // false for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true, // Enable debug output
      logger: true, // Log to console
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified successfully");
    } catch (verifyError: any) {
      console.error("❌ SMTP verification failed:", verifyError.message);
      return NextResponse.json(
        {
          error: "Email service configuration error",
          details: verifyError.message,
        },
        { status: 500 }
      );
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to || "anisdzed@gmail.com",
      subject: `[${priority}] Support Request: ${subject}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Support Request</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Priority:</strong> ${priority}</p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sent from Provision WorkSuite Support System
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", info.messageId);

    return NextResponse.json({
      success: true,
      message: "Support request sent successfully",
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error("❌ Support email error:", error);
    return NextResponse.json(
      {
        error: "Failed to send support request",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
