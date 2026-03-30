import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

// No Record<string,string> annotation — let TS infer literal key types for PlanType
export const PLAN_PRICE_MAP = {
  creators_monthly: process.env.STRIPE_PRICE_CREATORS_MONTHLY ?? "",
  creators_annual: process.env.STRIPE_PRICE_CREATORS_ANNUAL ?? "",
  boutique_annual: process.env.STRIPE_PRICE_BOUTIQUE_ANNUAL ?? "",
};

export type PlanType = keyof typeof PLAN_PRICE_MAP;

export function priceIdToPlanType(priceId: string): PlanType | null {
  const entry = Object.entries(PLAN_PRICE_MAP).find(([, pid]) => pid === priceId);
  return entry ? (entry[0] as PlanType) : null;
}
