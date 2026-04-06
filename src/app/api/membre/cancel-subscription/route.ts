import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { reason, comment } = body as { reason: string; comment?: string };

  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  // Get active subscription
  const [activeSub] = await db
    .select({
      id: subscriptions.id,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!activeSub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  // Cancel at period end via Stripe
  try {
    await stripe.subscriptions.update(activeSub.stripeSubscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancel_reason: reason,
        cancel_comment: comment ?? "",
        canceled_by: user.email ?? user.id,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    endDate: activeSub.currentPeriodEnd.toISOString(),
  });
}
