import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type UserAccess = {
  isSubscribed: boolean;
  hasCreatorAccess: boolean;
  hasBoutiqueAccess: boolean;
};

const NO_ACCESS: UserAccess = {
  isSubscribed: false,
  hasCreatorAccess: false,
  hasBoutiqueAccess: false,
};

export async function getUserAccess(userId: string | null | undefined): Promise<UserAccess> {
  if (!userId) return NO_ACCESS;

  const subs = await db
    .select({ planType: subscriptions.planType })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));

  if (subs.length === 0) return NO_ACCESS;

  const planTypes = subs.map((s) => s.planType);
  return {
    isSubscribed: true,
    hasCreatorAccess: planTypes.some((p) => p === "creators_monthly" || p === "creators_annual"),
    hasBoutiqueAccess: planTypes.some((p) => p === "boutique_annual"),
  };
}
