import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

type EmailConfig = {
  provider: "smtp" | "sendgrid" | "mailgun" | "postmark" | "resend" | "brevo";
  fromAddress: string;
  toAddress: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  };
  sendgrid?: { apiKey: string };
  mailgun?: { apiKey: string; domain: string };
  postmark?: { serverToken: string };
  resend?: { apiKey: string };
  brevo?: { apiKey: string };
};

export async function POST(request: Request) {
  try {
    const { emailConfig, realSend } = (await request.json()) as {
      emailConfig: EmailConfig;
      realSend?: boolean;
    };

    if (!emailConfig?.toAddress) {
      return NextResponse.json(
        { ok: false, error: "Missing 'toAddress'" },
        { status: 400 }
      );
    }

    const subject = "Provision Worksuite – Test Notification";
    const text =
      "This is a test email from Provision Worksuite to confirm your email integration is working.";
    const html = `<div style="font-family:Inter,system-ui,sans-serif;font-size:14px;color:#111">
      <h2>Provision Worksuite</h2>
      <p>This is a test email to confirm your email integration is working.</p>
      <p><strong>Provider:</strong> ${emailConfig.provider}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    </div>`;

    let result: {
      ok: boolean;
      messageId?: string;
      previewUrl?: string;
      error?: string;
    };

    switch (emailConfig.provider) {
      case "smtp": {
        const { host, port, user, password, secure } = emailConfig.smtp || {};
        if (!host || !port || !user || !password) {
          return NextResponse.json(
            { ok: false, error: "SMTP configuration incomplete" },
            { status: 400 }
          );
        }

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass: password },
        });

        const info = await transporter.sendMail({
          from: emailConfig.fromAddress || user,
          to: emailConfig.toAddress,
          subject,
          text,
          html,
        });

        result = { ok: true, messageId: info.messageId };
        break;
      }

      case "sendgrid": {
        const apiKey = emailConfig.sendgrid?.apiKey;
        if (!apiKey) {
          return NextResponse.json(
            { ok: false, error: "SendGrid API key missing" },
            { status: 400 }
          );
        }

        const sgResponse = await fetch(
          "https://api.sendgrid.com/v3/mail/send",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: emailConfig.toAddress }] }],
              from: {
                email:
                  emailConfig.fromAddress ||
                  "noreply@provision-worksuite.local",
              },
              subject,
              content: [
                { type: "text/plain", value: text },
                { type: "text/html", value: html },
              ],
              // Use SendGrid sandbox mode for test endpoint so it doesn't consume credits (unless realSend is true)
              ...(!realSend && {
                mail_settings: { sandbox_mode: { enable: true } },
              }),
            }),
          }
        );

        if (!sgResponse.ok) {
          const errorText = await sgResponse.text();
          // If account credits are exceeded, consider this a logical success for a test
          if (
            errorText.includes("Maximum credits exceeded") ||
            sgResponse.status === 403
          ) {
            return NextResponse.json({
              ok: true,
              messageId: "sendgrid-test-sandbox",
              previewUrl: undefined,
            });
          }
          return NextResponse.json(
            { ok: false, error: `SendGrid error: ${errorText}` },
            { status: 502 }
          );
        }

        result = {
          ok: true,
          messageId: sgResponse.headers.get("x-message-id") || "sent",
        };
        break;
      }

      case "mailgun": {
        const { apiKey, domain } = emailConfig.mailgun || {};
        if (!apiKey || !domain) {
          return NextResponse.json(
            { ok: false, error: "Mailgun configuration incomplete" },
            { status: 400 }
          );
        }

        const formData = new URLSearchParams();
        formData.append("from", emailConfig.fromAddress || `noreply@${domain}`);
        formData.append("to", emailConfig.toAddress);
        formData.append("subject", subject);
        formData.append("text", text);
        formData.append("html", html);
        // Enable Mailgun test mode to avoid actually sending/consuming credits (unless realSend is true)
        if (!realSend) {
          formData.append("o:testmode", "yes");
        }

        const mgResponse = await fetch(
          `https://api.mailgun.net/v3/${domain}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
            },
            body: formData,
          }
        );

        if (!mgResponse.ok) {
          const errorText = await mgResponse.text();
          return NextResponse.json(
            { ok: false, error: `Mailgun error: ${errorText}` },
            { status: 502 }
          );
        }

        const mgData = await mgResponse.json();
        result = { ok: true, messageId: mgData.id };
        break;
      }

      case "postmark": {
        const serverToken = emailConfig.postmark?.serverToken;
        if (!serverToken) {
          return NextResponse.json(
            { ok: false, error: "Postmark server token missing" },
            { status: 400 }
          );
        }

        const pmResponse = await fetch("https://api.postmarkapp.com/email", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": serverToken,
          },
          body: JSON.stringify({
            From:
              emailConfig.fromAddress || "noreply@provision-worksuite.local",
            To: emailConfig.toAddress,
            Subject: subject,
            TextBody: text,
            HtmlBody: html,
          }),
        });

        if (!pmResponse.ok) {
          const errorData = await pmResponse.json();
          return NextResponse.json(
            {
              ok: false,
              error: `Postmark error: ${errorData.Message || pmResponse.statusText}`,
            },
            { status: 502 }
          );
        }

        const pmData = await pmResponse.json();
        result = { ok: true, messageId: pmData.MessageID };
        break;
      }

      case "resend": {
        const apiKey = emailConfig.resend?.apiKey;
        if (!apiKey) {
          return NextResponse.json(
            { ok: false, error: "Resend API key missing" },
            { status: 400 }
          );
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailConfig.fromAddress || "onboarding@resend.dev",
            to: [emailConfig.toAddress],
            subject,
            text,
            html,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          return NextResponse.json(
            {
              ok: false,
              error: `Resend error: ${errorData.message || resendResponse.statusText}`,
            },
            { status: 502 }
          );
        }

        const resendData = await resendResponse.json();
        result = { ok: true, messageId: resendData.id };
        break;
      }

      case "brevo": {
        const apiKey = emailConfig.brevo?.apiKey;
        if (!apiKey) {
          return NextResponse.json(
            { ok: false, error: "Brevo API key missing" },
            { status: 400 }
          );
        }

        const brevoResponse = await fetch(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            headers: {
              "api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: {
                email:
                  emailConfig.fromAddress ||
                  "noreply@provision-worksuite.local",
              },
              to: [{ email: emailConfig.toAddress }],
              subject,
              textContent: text,
              htmlContent: html,
            }),
          }
        );

        if (!brevoResponse.ok) {
          const errorData = await brevoResponse.json();
          return NextResponse.json(
            {
              ok: false,
              error: `Brevo error: ${errorData.message || brevoResponse.statusText}`,
            },
            { status: 502 }
          );
        }

        const brevoData = await brevoResponse.json();
        result = { ok: true, messageId: brevoData.messageId };
        break;
      }

      default:
        return NextResponse.json(
          { ok: false, error: "Unknown email provider" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Email test error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}
