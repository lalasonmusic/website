import type Stripe from "stripe";
import { stripe, PLAN_PRICE_MAP, type PlanType } from "@/lib/stripe";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://lalason.com";

type CreateCheckoutParams = {
  userId: string;
  userEmail: string;
  planType: PlanType;
  stripeCustomerId?: string | null;
  locale: string;
};

type CreatePortalParams = {
  stripeCustomerId: string;
  locale: string;
};

export const stripeService = {
  async createCheckoutSession({
    userId,
    userEmail,
    planType,
    stripeCustomerId,
    locale,
  }: CreateCheckoutParams) {
    const priceId = PLAN_PRICE_MAP[planType];
    if (!priceId) throw new Error(`No price ID configured for plan: ${planType}`);

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ["card", "paypal"],
      success_url: `${BASE_URL}/${locale}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/${locale}/abonnement/annule`,
      customer_email: stripeCustomerId ? undefined : userEmail,
      customer: stripeCustomerId ?? undefined,
      metadata: { userId, planType, locale },
      subscription_data: {
        metadata: { userId, planType },
      },
      allow_promotion_codes: true,
    };
    return stripe.checkout.sessions.create(params);
  },

  async createPortalSession({ stripeCustomerId, locale }: CreatePortalParams) {
    return stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${BASE_URL}/${locale}/membre`,
    });
  },
};
