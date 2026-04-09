import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { youtubeChannels, subscriptions } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { sendAdminEmail } from "@/lib/services/emailService";

const MAX_CHANNELS = 3;

async function requireCreator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const [activeSub] = await db
    .select({ planType: subscriptions.planType })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);

  if (!activeSub || activeSub.planType === "boutique_annual") {
    return { error: NextResponse.json({ error: "YouTube whitelist requires a Creators plan" }, { status: 403 }) };
  }

  return { user, planType: activeSub.planType };
}

export async function POST(req: NextRequest) {
  const auth = await requireCreator();
  if ("error" in auth) return auth.error;
  const { user, planType } = auth;

  const body = await req.json();
  const channelId = (body.channelId ?? "").trim();

  if (!channelId.startsWith("UC") || channelId.length < 24) {
    return NextResponse.json({ error: "Invalid YouTube Channel ID" }, { status: 400 });
  }

  // Enforce max channels per user
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(youtubeChannels)
    .where(eq(youtubeChannels.userId, user.id));

  if (existingCount >= MAX_CHANNELS) {
    return NextResponse.json({ error: `Vous avez déjà atteint la limite de ${MAX_CHANNELS} chaînes.` }, { status: 400 });
  }

  await db.insert(youtubeChannels).values({
    userId: user.id,
    channelId,
    status: "pending",
  });

  sendAdminEmail({
    subject: `Nouvelle whitelist YouTube — ${channelId}`,
    html: `<p>Un créateur a soumis son Channel ID YouTube.</p>
<ul>
  <li><strong>Channel ID :</strong> ${channelId}</li>
  <li><strong>User ID :</strong> ${user.id}</li>
  <li><strong>Email :</strong> ${user.email ?? "inconnu"}</li>
  <li><strong>Plan :</strong> ${planType}</li>
</ul>
<p><a href="https://www.youtube.com/channel/${channelId}">Voir la chaîne</a></p>`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireCreator();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Only delete if the row belongs to this user
  await db
    .delete(youtubeChannels)
    .where(and(eq(youtubeChannels.id, id), eq(youtubeChannels.userId, user.id)));

  return NextResponse.json({ success: true });
}
