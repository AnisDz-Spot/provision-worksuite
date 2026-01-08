import nodemailer from "nodemailer";
import crypto from "crypto";

/**
 * Email configuration type
 */
export type EmailConfig = {
  provider: "smtp" | "sendgrid" | "mailgun" | "resend";
  fromAddress: string;
  fromName?: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  };
  sendgrid?: { apiKey: string };
  mailgun?: { apiKey: string; domain: string };
  resend?: { apiKey: string };
};

// Encryption helpers
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "provision-default-key-change-in-production";
const ALGORITHM = "aes-256-cbc";

function decrypt(text: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
    const parts = text.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    console.error("[Email] Decryption failed:", e);
    return "";
  }
}

/**
 * Get email configuration from database
 * Falls back to Ethereal test account if no configuration exists
 */
export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    const settings = await prisma.emailSettings.findFirst();

    if (!settings) {
      console.log("[Email] No email configuration found in database");
      return null;
    }

    const config: EmailConfig = {
      provider: settings.provider as EmailConfig["provider"],
      fromAddress: settings.fromAddress,
      fromName: settings.fromName || undefined,
    };

    switch (settings.provider) {
      case "smtp":
        if (settings.smtpHost && settings.smtpUser && settings.smtpPassword) {
          config.smtp = {
            host: settings.smtpHost,
            port: settings.smtpPort || 587,
            user: settings.smtpUser,
            password: decrypt(settings.smtpPassword),
            secure: settings.smtpSecure,
          };
        } else {
          console.log("[Email] SMTP configuration incomplete");
          return null;
        }
        break;
      case "sendgrid":
        if (settings.sendgridApiKey) {
          config.sendgrid = { apiKey: decrypt(settings.sendgridApiKey) };
        } else {
          console.log("[Email] SendGrid configuration incomplete");
          return null;
        }
        break;
      case "mailgun":
        if (settings.mailgunApiKey && settings.mailgunDomain) {
          config.mailgun = {
            apiKey: decrypt(settings.mailgunApiKey),
            domain: settings.mailgunDomain,
          };
        } else {
          console.log("[Email] Mailgun configuration incomplete");
          return null;
        }
        break;
      case "resend":
        if (settings.resendApiKey) {
          config.resend = { apiKey: decrypt(settings.resendApiKey) };
        } else {
          console.log("[Email] Resend configuration incomplete");
          return null;
        }
        break;
      default:
        console.log("[Email] Unknown provider");
        return null;
    }

    return config;
  } catch (error) {
    console.error("[Email] Failed to fetch config from database:", error);
    return null;
  }
}

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Send an email using the configured provider or Ethereal for testing
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string; previewUrl?: string }> {
  const config = await getEmailConfig();

  if (!config) {
    return {
      success: false,
      error:
        "Email provider not configured. Please visit Settings to set up your email provider.",
    };
  }

  const fromAddress = config.fromName
    ? `"${config.fromName}" <${config.fromAddress}>`
    : config.fromAddress;

  try {
    switch (config.provider) {
      case "smtp": {
        if (!config.smtp) {
          return { success: false, error: "SMTP configuration incomplete" };
        }

        const transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.password,
          },
        });

        await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        return { success: true };
      }

      case "sendgrid": {
        if (!config.sendgrid?.apiKey) {
          return { success: false, error: "SendGrid API key missing" };
        }

        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.sendgrid.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: options.to }] }],
            from: { email: fromAddress }, // SendGrid might require verification of this email
            subject: options.subject,
            content: [
              { type: "text/plain", value: options.text },
              { type: "text/html", value: options.html },
            ],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          return { success: false, error: `SendGrid error: ${error}` };
        }

        return { success: true };
      }

      case "mailgun": {
        if (!config.mailgun?.apiKey || !config.mailgun?.domain) {
          return { success: false, error: "Mailgun configuration incomplete" };
        }

        const formData = new URLSearchParams();
        formData.append("from", fromAddress);
        formData.append("to", options.to);
        formData.append("subject", options.subject);
        formData.append("text", options.text);
        formData.append("html", options.html);

        const response = await fetch(
          `https://api.mailgun.net/v3/${config.mailgun.domain}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`api:${config.mailgun.apiKey}`).toString("base64")}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const error = await response.text();
          return { success: false, error: `Mailgun error: ${error}` };
        }

        return { success: true };
      }

      case "resend": {
        if (!config.resend?.apiKey) {
          return { success: false, error: "Resend API key missing" };
        }

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.resend.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [options.to],
            subject: options.subject,
            text: options.text,
            html: options.html,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          return { success: false, error: `Resend error: ${error.message}` };
        }

        return { success: true };
      }

      default:
        return { success: false, error: "Unknown email provider" };
    }
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message || "Failed to send email" };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  const subject = "Reset Your Password - Provision WorkSuite";
  const text = `
You requested to reset your password for Provision WorkSuite.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Provision WorkSuite</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
    
    <p>You requested to reset your password. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      This link will expire in <strong>1 hour</strong>.
    </p>
    
    <p style="color: #666; font-size: 14px;">
      If you didn't request this password reset, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({ to: email, subject, text, html });
}

export async function sendProjectInvitationEmail(
  email: string,
  projectName: string,
  projectUrl: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `You've been added to project: ${projectName}`;
  const text = `
You have been added to the project "${projectName}" on Provision WorkSuite.

View the project here:
${projectUrl}

--
Provision WorkSuite Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Project Assignment</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">You've been added to a project</h2>
    
    <p>You are now a member of <strong>${projectName}</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${projectUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        View Project
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      <a href="${projectUrl}" style="color: #10b981; word-break: break-all;">${projectUrl}</a>
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({ to: email, subject, text, html });
}
