import nodemailer from "nodemailer";
import { decrypt } from "@/lib/encryption";

/**
 * Email configuration type
 */
export type EmailConfig = {
  provider:
    | "smtp"
    | "sendgrid"
    | "mailgun"
    | "resend"
    | "postmark"
    | "brevo"
    | "ses";
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
  postmark?: { apiKey: string };
  brevo?: { apiKey: string };
  ses?: { accessKey: string; secretKey: string; region: string };
};

// Encryption helpers moved to @/lib/encryption

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
      case "postmark":
        if (settings.postmarkApiKey) {
          config.postmark = { apiKey: decrypt(settings.postmarkApiKey) };
        } else {
          console.log("[Email] Postmark configuration incomplete");
          return null;
        }
        break;
      case "brevo":
        if (settings.brevoApiKey) {
          config.brevo = { apiKey: decrypt(settings.brevoApiKey) };
        } else {
          console.log("[Email] Brevo configuration incomplete");
          return null;
        }
        break;
      case "ses":
        if (
          settings.awsAccessKey &&
          settings.awsSecretKey &&
          settings.awsRegion
        ) {
          config.ses = {
            accessKey: decrypt(settings.awsAccessKey),
            secretKey: decrypt(settings.awsSecretKey),
            region: settings.awsRegion,
          };
        } else {
          console.log("[Email] AWS SES configuration incomplete");
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

      case "postmark": {
        if (!config.postmark?.apiKey) {
          return { success: false, error: "Postmark API key missing" };
        }

        const response = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            "X-Postmark-Server-Token": config.postmark.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            From: fromAddress,
            To: options.to,
            Subject: options.subject,
            TextBody: options.text,
            HtmlBody: options.html,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            error: `Postmark error: ${error.Message || "Unknown error"}`,
          };
        }

        return { success: true };
      }

      case "brevo": {
        if (!config.brevo?.apiKey) {
          return { success: false, error: "Brevo API key missing" };
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": config.brevo.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            sender: config.fromName
              ? { name: config.fromName, email: config.fromAddress }
              : { email: config.fromAddress },
            to: [{ email: options.to }],
            subject: options.subject,
            textContent: options.text,
            htmlContent: options.html,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          return {
            success: false,
            error: `Brevo error: ${error.message || "Unknown error"}`,
          };
        }

        return { success: true };
      }

      case "ses": {
        if (!config.ses) {
          return { success: false, error: "AWS SES configuration missing" };
        }

        // For ThemeForest, easier to use SMTP for SES than complex SigV4 API
        const transporter = nodemailer.createTransport({
          host: `email-smtp.${config.ses.region}.amazonaws.com`,
          port: 587,
          secure: false, // TLS
          auth: {
            user: config.ses.accessKey,
            pass: config.ses.secretKey,
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

export async function sendMeetingInvitationEmail(
  email: string,
  meetingTitle: string,
  meetingDate: string,
  meetingUrl: string
): Promise<{ success: boolean; error?: string }> {
  const subject = `New Meeting: ${meetingTitle}`;
  const formattedDate = new Date(meetingDate).toLocaleString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const text = `
You've been invited to a meeting: ${meetingTitle}
Date: ${formattedDate}

Join or view details here:
${meetingUrl}

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
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Meeting Invitation</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; margin-top: 0;">${meetingTitle}</h2>
    
    <p>You have been invited to a meeting on Provision WorkSuite.</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #4b5563; font-size: 14px;">Date & Time</p>
      <p style="margin: 5px 0 0 0; font-weight: 600;">${formattedDate}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${meetingUrl}" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
        View Meeting Details
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin-bottom: 0;">
      <a href="${meetingUrl}" style="color: #8b5cf6; word-break: break-all;">${meetingUrl}</a>
    </p>
  </div>
</body>
</html>
`;

  return sendEmail({ to: email, subject, text, html });
}
