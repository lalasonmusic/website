import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email(),
  locale: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    await db
      .insert(newsletterSubscribers)
      .values({
        email: parsed.data.email.toLowerCase(),
        locale: parsed.data.locale ?? null,
      })
      .onConflictDoNothing({ target: newsletterSubscribers.email });
  } catch (err) {
    console.error("[newsletter] insert error:", err);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
