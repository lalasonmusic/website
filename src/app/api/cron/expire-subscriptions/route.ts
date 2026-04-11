import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { subscriptions, profiles } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";

// Daily safety net: any subscription whose period ended but is still marked
// "active" (legacy Wix migration rows, missed Stripe webhooks, manual edits)
// gets flipped to "canceled" and the profile follows.
//
// Triggered by Vercel Cron (see vercel.json). Auth: Bearer CRON_SECRET.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expired = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(
      and(eq(subscriptions.status, "active"), lt(subscriptions.currentPeriodEnd, now))
    );

  if (expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 });
  }

  let subRowsUpdated = 0;
  let profileRowsUpdated = 0;

  for (const sub of expired) {
    const subUpdate = await db
      .update(subscriptions)
      .set({ status: "canceled", updatedAt: now })
      .where(eq(subscriptions.id, sub.id))
      .returning({ id: subscriptions.id });
    subRowsUpdated += subUpdate.length;

    const profileUpdate = await db
      .update(profiles)
      .set({ subscriptionStatus: "canceled", updatedAt: now })
      .where(eq(profiles.id, sub.userId))
      .returning({ id: profiles.id });
    profileRowsUpdated += profileUpdate.length;
  }

  console.log(
    `[cron/expire-subscriptions] expired=${expired.length} subRows=${subRowsUpdated} profileRows=${profileRowsUpdated}`
  );

  return NextResponse.json({
    ok: true,
    expired: expired.length,
    subRowsUpdated,
    profileRowsUpdated,
    expiredIds: expired.map((s) => s.id),
  });
}
