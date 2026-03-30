import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const apiKey = process.env.MAILER_LITE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ email: parsed.data.email }),
    signal: AbortSignal.timeout(8000),
  });

  // 409 = already subscribed — treat as success
  if (!res.ok && res.status !== 409) {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
