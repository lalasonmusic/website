import { NextResponse, type NextRequest } from "next/server";
import { stripe, priceIdToPlanType, type PlanType } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type Stripe from "stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

const VALID_PLAN_TYPES: PlanType[] = ["creators_monthly", "creators_annual", "boutique_annual"];

function toValidPlanType(raw: string | null | undefined): PlanType {
  if (raw && (VALID_PLAN_TYPES as string[]).includes(raw)) return raw as PlanType;
  return "creators_monthly";
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const item = sub.items.data[0];
  const priceId = item?.price.id ?? "";
  const planType = toValidPlanType(sub.metadata?.planType ?? priceIdToPlanType(priceId));
  // In Stripe API 2026+ current_period_end lives on the item, not the subscription.
  // Fall back to the subscription field for older API versions.
  const periodEndUnix =
    (item as unknown as { current_period_end?: number })?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  if (!periodEndUnix) {
    console.error("[Stripe webhook] No current_period_end found on subscription", sub.id);
    return;
  }
  const currentPeriodEnd = new Date(periodEndUnix * 1000);
  const status = sub.status; // active | canceled | past_due | etc.

  // Map Stripe status to our enum
  const dbStatus = ["active", "canceled", "past_due", "unpaid"].includes(status)
    ? (status as "active" | "canceled" | "past_due" | "unpaid")
    : "canceled";

  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      planType,
      status: dbStatus,
      currentPeriodEnd,
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: { status: dbStatus, currentPeriodEnd, stripePriceId: priceId, planType },
    });

  // Update profile subscription status
  await db
    .update(profiles)
    .set({
      subscriptionStatus: dbStatus === "active" ? "active" : dbStatus === "past_due" ? "past_due" : "canceled",
      subscriptionEndDate: currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription || !session.customer) return;

  // Store Stripe customer ID on profile
  await db
    .update(profiles)
    .set({ stripeCustomerId: session.customer as string, updatedAt: new Date() })
    .where(eq(profiles.id, userId));

  // Retrieve full subscription and upsert
  const sub = await stripe.subscriptions.retrieve(session.subscription as string, {
    expand: ["items.data.price"],
  });
  await upsertSubscription(sub);
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  await upsertSubscription(sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  await db
    .update(subscriptions)
    .set({ status: "canceled" })
    .where(and(eq(subscriptions.stripeSubscriptionId, sub.id)));

  await db
    .update(profiles)
    .set({ subscriptionStatus: "canceled", updatedAt: new Date() })
    .where(eq(profiles.id, userId));
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // invoice.subscription was removed in newer Stripe API versions — access via parent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = invoice as any;
  const subId: string | undefined =
    raw.subscription ?? raw.parent?.subscription_details?.subscription;
  if (!subId) return;

  await db
    .update(subscriptions)
    .set({ status: "past_due" })
    .where(eq(subscriptions.stripeSubscriptionId, subId));

  // Find userId from subscriptions table
  const [sub] = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subId))
    .limit(1);

  if (sub) {
    await db
      .update(profiles)
      .set({ subscriptionStatus: "past_due", updatedAt: new Date() })
      .where(eq(profiles.id, sub.userId));
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error(`[Stripe webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
