import { NextResponse } from "next/server";

type PostBody = {
  type: "slack" | "teams";
  webhookUrl?: string;
  payload: any;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PostBody;
    if (!body || !body.type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 });
    }

    // Prefer server-side env for security; fall back to provided URL
    const slackEnv = process.env.SLACK_WEBHOOK_URL;
    const teamsEnv = process.env.TEAMS_WEBHOOK_URL;
    const webhookUrl =
      body.webhookUrl || (body.type === "slack" ? slackEnv : teamsEnv);
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL not configured" },
        { status: 400 }
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
