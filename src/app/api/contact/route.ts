import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAdminEmail } from "@/lib/services/emailService";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`contact:${ip}`, 3, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  sendAdminEmail({
    subject: `Contact Lalason — ${subject}`,
    html: `<p><strong>${name}</strong> (${email}) a envoyé un message :</p>
<blockquote>${message.replace(/\n/g, "<br>")}</blockquote>
<p>Répondre à : <a href="mailto:${email}">${email}</a></p>`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
