import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripeService } from "@/lib/services/stripeService";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { type PlanType, PLAN_PRICE_MAP } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { planType, locale = "fr" } = body as { planType: PlanType; locale?: string };

  // TEMP DEBUG — to be removed once checkout is verified
  console.log("[checkout] received planType:", planType);
  console.log("[checkout] PLAN_PRICE_MAP:", JSON.stringify({
    creators_monthly: PLAN_PRICE_MAP.creators_monthly ? "set" : "EMPTY",
    creators_annual: PLAN_PRICE_MAP.creators_annual ? "set" : "EMPTY",
    boutique_annual: PLAN_PRICE_MAP.boutique_annual ? "set" : "EMPTY",
  }));
  console.log("[checkout] resolved priceId:", PLAN_PRICE_MAP[planType] ? PLAN_PRICE_MAP[planType].slice(0, 12) + "..." : "EMPTY");

  if (!planType || !PLAN_PRICE_MAP[planType]) {
    console.error("[checkout] REJECTED — planType missing or no price mapped");
    return NextResponse.json({ error: "Invalid plan type", planType, hasPrice: !!PLAN_PRICE_MAP[planType] }, { status: 400 });
  }

  // Get existing Stripe customer ID if any
  const [profile] = await db
    .select({ stripeCustomerId: profiles.stripeCustomerId })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const session = await stripeService.createCheckoutSession({
    userId: user.id,
    userEmail: user.email!,
    planType,
    stripeCustomerId: profile?.stripeCustomerId,
    locale,
  });

  return NextResponse.json({ url: session.url });
}
