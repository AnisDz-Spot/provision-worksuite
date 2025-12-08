import nodemailer from "nodemailer";

/**
 * Email configuration from environment variables
 * For production, set these in your .env file
 */
export type EmailConfig = {
  provider: "smtp" | "sendgrid" | "mailgun" | "resend";
  fromAddress: string;
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

/**
 * Get email configuration from environment variables
 */
export function getEmailConfig(): EmailConfig | null {
  const provider = process.env.EMAIL_PROVIDER as EmailConfig["provider"];
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;

  if (!provider || !fromAddress) {
    console.warn(
      "Email not configured: EMAIL_PROVIDER and EMAIL_FROM_ADDRESS required"
    );
    return null;
  }

  const config: EmailConfig = {
    provider,
    fromAddress,
  };

  switch (provider) {
    case "smtp":
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      ) {
        config.smtp = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10),
          user: process.env.SMTP_USER,
          password: process.env.SMTP_PASSWORD,
          secure: process.env.SMTP_SECURE === "true",
        };
      }
      break;
    case "sendgrid":
      if (process.env.SENDGRID_API_KEY) {
        config.sendgrid = { apiKey: process.env.SENDGRID_API_KEY };
      }
      break;
    case "mailgun":
      if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
        config.mailgun = {
          apiKey: process.env.MAILGUN_API_KEY,
          domain: process.env.MAILGUN_DOMAIN,
        };
      }
      break;
    case "resend":
      if (process.env.RESEND_API_KEY) {
        config.resend = { apiKey: process.env.RESEND_API_KEY };
      }
      break;
  }

  return config;
}

type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Send an email using the configured provider
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; error?: string }> {
  const config = getEmailConfig();

  if (!config) {
    return { success: false, error: "Email not configured" };
  }

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
          from: config.fromAddress,
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
            from: { email: config.fromAddress },
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
        formData.append("from", config.fromAddress);
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
            from: config.fromAddress,
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
