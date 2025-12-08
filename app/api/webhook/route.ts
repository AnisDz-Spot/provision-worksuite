import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

type PostBody = {
  type: "slack" | "teams";
  payload: any;
};

export async function POST(req: Request) {
  try {
    // SECURITY: Require authentication to send webhooks
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as PostBody;
    if (!body || !body.type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 });
    }

    // SECURITY FIX: Only use server-configured webhook URLs - never accept from client
    // This prevents SSRF (Server-Side Request Forgery) attacks
    const webhookUrl =
      body.type === "slack"
        ? process.env.SLACK_WEBHOOK_URL
        : process.env.TEAMS_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: `${body.type} webhook not configured on server` },
        { status: 503 }
      );
    }

    let resp: Response;
    if (body.type === "slack") {
      // Slack Incoming Webhook: send JSON payload (supports blocks)
      resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Weekly Digest", ...body.payload }),
      });
    } else {
      // Microsoft Teams Incoming Webhook with Adaptive Card via attachments wrapper
      const teamsMessage = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            contentUrl: null,
            content: body.payload,
          },
        ],
      };
      resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamsMessage),
      });
    }

    const ok = resp.ok;
    const text = await resp.text();
    return NextResponse.json(
      { ok, response: text },
      { status: ok ? 200 : 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
