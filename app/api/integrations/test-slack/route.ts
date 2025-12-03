import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { webhookUrl, channel } = await request.json();
    if (!webhookUrl || typeof webhookUrl !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing 'webhookUrl'" },
        { status: 400 }
      );
    }

    const payload = {
      text: `:white_check_mark: Provision Worksuite – Test Notification\nChannel: ${channel || "(default)"}\nTime: ${new Date().toISOString()}`,
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { ok: false, error: `Slack webhook error: ${text || resp.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to send Slack message" },
      { status: 500 }
    );
  }
}
