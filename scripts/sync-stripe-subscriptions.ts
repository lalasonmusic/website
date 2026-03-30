/**
 * Sync existing Stripe subscriptions into the database.
 *
 * Usage:
 *   npx tsx scripts/sync-stripe-subscriptions.ts
 *
 * Requires DATABASE_URL and STRIPE_SECRET_KEY in .env.local (loaded via @next/env).
 *
 * What it does:
 *   1. Lists all Stripe subscriptions (active + past_due + canceled)
 *   2. For each subscription, finds the Supabase user by email
 *   3. Upserts profiles.stripeCustomerId + subscriptionStatus
 *   4. Upserts subscriptions table row
 *   5. Prints a summary report
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import Stripe from "stripe";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { profiles, subscriptions } from "../src/db/schema";

// ── Stripe client ──
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error("❌ STRIPE_SECRET_KEY is not set");
  process.exit(1);
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-03-25.dahlia",
});

// ── DB client ──
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}
const sql = postgres(databaseUrl, { prepare: false });
const db = drizzle(sql);

// ── Plan type resolution ──
const PRICE_TO_PLAN: Record<string, "creators_monthly" | "creators_annual" | "boutique_annual"> = {
  [process.env.STRIPE_PRICE_CREATORS_MONTHLY ?? ""]: "creators_monthly",
  [process.env.STRIPE_PRICE_CREATORS_ANNUAL ?? ""]: "creators_annual",
  [process.env.STRIPE_PRICE_BOUTIQUE_ANNUAL ?? ""]: "boutique_annual",
};

function resolvePlanType(priceId: string) {
  return PRICE_TO_PLAN[priceId] ?? null;
}

function toSubscriptionStatus(status: string) {
  const valid = ["active", "canceled", "past_due", "unpaid", "none"] as const;
  type Status = (typeof valid)[number];
  if (valid.includes(status as Status)) return status as Status;
  return "none" as const;
}

// ── Main ──
async function main() {
  console.log("🔄 Fetching Stripe subscriptions...\n");

  const stats = { synced: 0, skippedNoUser: 0, skippedNoPlan: 0, errors: 0 };

  // Paginate through all subscriptions
  for await (const sub of stripe.subscriptions.list({
    status: "all",
    expand: ["data.customer"],
    limit: 100,
  })) {
    const customer = sub.customer as Stripe.Customer;
    const email = customer.email;

    if (!email) {
      console.log(`  ⏭️  Sub ${sub.id} — customer ${customer.id} has no email, skipping`);
      stats.skippedNoUser++;
      continue;
    }

    // Resolve the plan type from the first line item price
    const firstItem = sub.items.data[0];
    const priceId = firstItem?.price?.id;
    if (!priceId || !firstItem) {
      console.log(`  ⏭️  Sub ${sub.id} — no price found, skipping`);
      stats.skippedNoPlan++;
      continue;
    }

    const planType = resolvePlanType(priceId);
    if (!planType) {
      console.log(`  ⚠️  Sub ${sub.id} — unknown priceId ${priceId}, skipping`);
      stats.skippedNoPlan++;
      continue;
    }

    // In Stripe SDK v21, current_period_end lives on SubscriptionItem, not Subscription
    const periodEnd = firstItem.current_period_end;

    // Find the user profile by stripe_customer_id OR we'll look up by Supabase auth
    // First try to find an existing profile linked to this Stripe customer
    const [existingProfile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.stripeCustomerId, customer.id))
      .limit(1);

    if (!existingProfile) {
      console.log(`  ⏭️  Sub ${sub.id} — no profile for customer ${customer.id} (${email}), skipping`);
      console.log(`       → User must sign up first, then re-run this script`);
      stats.skippedNoUser++;
      continue;
    }

    const userId = existingProfile.id;
    const subStatus = toSubscriptionStatus(sub.status ?? "none");

    try {
      // Upsert profile subscription status
      await db
        .update(profiles)
        .set({
          subscriptionStatus: subStatus,
          subscriptionEndDate: new Date(periodEnd * 1000),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, userId));

      // Upsert subscription row (on conflict update)
      const existing = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(subscriptions)
          .set({
            stripePriceId: priceId,
            planType,
            status: sub.status ?? "unknown",
            currentPeriodEnd: new Date(periodEnd * 1000),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      } else {
        await db.insert(subscriptions).values({
          userId,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          planType,
          status: sub.status ?? "unknown",
          currentPeriodEnd: new Date(periodEnd * 1000),
        });
      }

      console.log(`  ✅ ${email} — ${planType} (${subStatus})`);
      stats.synced++;
    } catch (err) {
      console.error(`  ❌ ${email} — error:`, err);
      stats.errors++;
    }
  }

  console.log("\n── Summary ──");
  console.log(`  Synced:          ${stats.synced}`);
  console.log(`  Skipped (user):  ${stats.skippedNoUser}`);
  console.log(`  Skipped (plan):  ${stats.skippedNoPlan}`);
  console.log(`  Errors:          ${stats.errors}`);

  await sql.end();
  process.exit(stats.errors > 0 ? 1 : 0);
}

main();
