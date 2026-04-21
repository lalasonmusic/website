import { NextResponse, type NextRequest } from "next/server";
import { stripe, priceIdToPlanType, type PlanType } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, profiles, webhookEvents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendAdminEmail } from "@/lib/services/emailService";
import type Stripe from "stripe";

const PLAN_LABELS: Record<PlanType, string> = {
  creators_monthly: "Créateurs — Mensuel",
  creators_annual: "Créateurs — Annuel",
  boutique_annual: "Boutique — Annuel",
};

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

  await db.transaction(async (tx) => {
    await tx
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

    await tx
      .update(profiles)
      .set({
        subscriptionStatus: dbStatus === "active" ? "active" : dbStatus === "past_due" ? "past_due" : "canceled",
        subscriptionEndDate: currentPeriodEnd,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId));
  });
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

  // Notify admin by email
  try {
    const planType = toValidPlanType(sub.metadata?.planType);
    const planLabel = PLAN_LABELS[planType];
    const customerEmail = session.customer_details?.email ?? session.customer_email ?? "—";
    const customerName = session.customer_details?.name ?? "—";
    const amount = session.amount_total ?? 0;
    const currency = (session.currency ?? "eur").toUpperCase();
    const formattedAmount = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(amount / 100);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #1b3a4b;">Nouvel abonnement Lalason</h2>
        <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
          <tr><td style="padding: 8px 0; color: #64748b;">Client</td><td style="padding: 8px 0; font-weight: 600;">${customerName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Email</td><td style="padding: 8px 0; font-weight: 600;">${customerEmail}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Formule</td><td style="padding: 8px 0; font-weight: 600;">${planLabel}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Montant</td><td style="padding: 8px 0; font-weight: 600; color: #22c55e;">${formattedAmount}</td></tr>
        </table>
        <p style="margin-top: 24px;">
          <a href="https://lalason.com/admin/clients" style="background: #f5a623; color: #1b3a4b; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: 600;">Voir dans le dashboard</a>
        </p>
      </div>
    `;

    await sendAdminEmail({
      subject: `Nouvel abonnement — ${planLabel} — ${customerEmail}`,
      html,
    });
  } catch (err) {
    console.error("[Stripe webhook] Failed to send admin notification email:", err);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  await upsertSubscription(sub);
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({ status: "canceled" })
      .where(and(eq(subscriptions.stripeSubscriptionId, sub.id)));

    await tx
      .update(profiles)
      .set({ subscriptionStatus: "canceled", updatedAt: new Date() })
      .where(eq(profiles.id, userId));
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // invoice.subscription was removed in newer Stripe API versions — access via parent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = invoice as any;
  const subId: string | undefined =
    raw.subscription ?? raw.parent?.subscription_details?.subscription;
  if (!subId) return;

  await db.transaction(async (tx) => {
    await tx
      .update(subscriptions)
      .set({ status: "past_due" })
      .where(eq(subscriptions.stripeSubscriptionId, subId));

    const [sub] = await tx
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subId))
      .limit(1);

    if (sub) {
      await tx
        .update(profiles)
        .set({ subscriptionStatus: "past_due", updatedAt: new Date() })
        .where(eq(profiles.id, sub.userId));
    }
  });
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

  // Idempotency: Stripe may retry the same event. Skip if already processed.
  try {
    await db.insert(webhookEvents).values({ stripeEventId: event.id });
  } catch {
    // Unique constraint violation = event already processed
    return NextResponse.json({ received: true, deduped: true });
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
