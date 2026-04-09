import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { tiktokAccounts, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendAdminEmail } from "@/lib/services/emailService";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const accountUrl = (body.accountUrl ?? "").trim();

  // Basic validation: must look like a TikTok URL
  if (!accountUrl.toLowerCase().includes("tiktok.com")) {
    return NextResponse.json({ error: "URL TikTok invalide" }, { status: 400 });
  }

  // Only Creators plans include TikTok whitelist
  const [activeSub] = await db
    .select({ planType: subscriptions.planType })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);

  if (!activeSub || activeSub.planType === "boutique_annual") {
    return NextResponse.json({ error: "TikTok whitelist requires a Creators plan" }, { status: 403 });
  }

  await db.insert(tiktokAccounts).values({
    userId: user.id,
    accountUrl,
    status: "pending",
  });

  sendAdminEmail({
    subject: `Nouvelle whitelist TikTok — ${accountUrl}`,
    html: `<p>Un créateur a soumis son compte TikTok.</p>
<ul>
  <li><strong>URL :</strong> ${accountUrl}</li>
  <li><strong>User ID :</strong> ${user.id}</li>
  <li><strong>Email :</strong> ${user.email ?? "inconnu"}</li>
  <li><strong>Plan :</strong> ${activeSub.planType}</li>
</ul>
<p><a href="${accountUrl}">Voir le compte</a></p>`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
