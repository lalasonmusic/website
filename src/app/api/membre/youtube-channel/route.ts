import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { youtubeChannels, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const channelId = (body.channelId ?? "").trim();

  if (!channelId.startsWith("UC") || channelId.length < 24) {
    return NextResponse.json({ error: "Invalid YouTube Channel ID" }, { status: 400 });
  }

  // Only Creators plans include YouTube whitelist
  const [activeSub] = await db
    .select({ planType: subscriptions.planType })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);

  if (!activeSub || activeSub.planType === "boutique_annual") {
    return NextResponse.json({ error: "YouTube whitelist requires a Creators plan" }, { status: 403 });
  }

  await db.insert(youtubeChannels).values({
    userId: user.id,
    channelId,
    status: "pending",
  });

  // TODO: send email notification to admin once mailer is configured

  return NextResponse.json({ success: true });
}
