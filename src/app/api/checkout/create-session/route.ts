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

  if (!planType || !PLAN_PRICE_MAP[planType]) {
    return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
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
