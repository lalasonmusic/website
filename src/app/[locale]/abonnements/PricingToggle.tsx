"use client";

import { useState, useEffect } from "react";
import { track } from "@/lib/analytics";

type PlanType = "creators_monthly" | "creators_annual" | "boutique_annual";

async function startCheckout(
  planType: PlanType,
  locale: string,
  onError: (msg: string) => void,
) {
  track("checkout_start", { planType });
  const res = await fetch("/api/checkout/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planType, locale }),
  });

  if (res.status === 401) {
    window.location.href = `/${locale}/connexion`;
    return;
  }

  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
    return;
  }

  onError(data.error ?? `Erreur inattendue (HTTP ${res.status})`);
}

type CreatorsData = {
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  badge: string;
};

type BoutiqueData = {
  name: string;
  description: string;
  annualPrice: string;
  features: string[];
  badge: string;
};

type Props = {
  locale: string;
  labels: { monthly: string; annual: string; save: string };
  creatorsData: CreatorsData;
  boutiqueData: BoutiqueData;
  subscribeLabel: string;
  perMonth: string;
  perYear: string;
  trustLabels: {
    noCommitment: string;
    moneyBack: string;
    securePayment: string;
  };
  confirmLabels: {
    title: string;
    desc: string;
    bullet1: string;
    bullet2: string;
    bullet3: string;
    bullet4: string;
    secure: string;
    cta: string;
    cancel: string;
  };
};

function CheckIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="var(--color-accent)" fillOpacity={0.12} />
      <path
        d="M6.5 10.5L9 13L13.5 7.5"
        stroke="var(--color-accent)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PricingToggle({
  locale,
  labels,
  creatorsData,
  boutiqueData,
  subscribeLabel,
  perMonth,
  perYear,
  trustLabels,
  confirmLabels,
}: Props) {
  // CRO: default to annual — most-attractive deal first, matches every
  // major competitor (Epidemic Sound, Artlist, Bensound). Monthly remains
  // one click away via the toggle.
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  // CRO: a confirmation step between "Subscribe" click and Stripe redirect.
  // Reduces checkout abandonment by reaffirming value + guarantees + secure
  // payment right before the user enters card details — the most anxious
  // moment of the funnel.
  const [confirmingPlan, setConfirmingPlan] = useState<PlanType | null>(null);

  // Allow Escape to dismiss the confirmation modal (unless we're already
  // mid-redirect to Stripe — let that finish to avoid leaving the user in
  // a half-state).
  useEffect(() => {
    if (!confirmingPlan) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && loadingPlan === null) {
        if (confirmingPlan) track("checkout_modal_cancel", { planType: confirmingPlan, source: "escape" });
        setConfirmingPlan(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmingPlan, loadingPlan]);

  async function startStripeRedirect(planType: PlanType) {
    setLoadingPlan(planType);
    setError(null);
    try {
      await startCheckout(planType, locale, setError);
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    }
    setLoadingPlan(null);
  }

  function handleSubscribeCreators() {
    const planType: PlanType = isAnnual ? "creators_annual" : "creators_monthly";
    track("pricing_cta_click", { planType, source: "card" });
    setConfirmingPlan(planType);
  }

  function handleSubscribeBoutique() {
    track("pricing_cta_click", { planType: "boutique_annual", source: "card" });
    setConfirmingPlan("boutique_annual");
  }

  function dismissConfirmation() {
    if (loadingPlan !== null) return;
    if (confirmingPlan) {
      track("checkout_modal_cancel", { planType: confirmingPlan });
    }
    setConfirmingPlan(null);
  }

  function continueToStripe(planType: PlanType) {
    track("checkout_modal_continue", { planType });
    startStripeRedirect(planType);
  }

  // Resolve human-readable plan name + price for the confirmation modal
  function getConfirmationDetails(planType: PlanType) {
    if (planType === "boutique_annual") {
      return {
        name: boutiqueData.name,
        price: boutiqueData.annualPrice,
        period: perYear,
      };
    }
    return {
      name: creatorsData.name,
      price: planType === "creators_annual" ? creatorsData.annualPrice : creatorsData.monthlyPrice,
      period: planType === "creators_annual" ? perYear : perMonth,
    };
  }

  return (
    <div className="overflow-hidden">
      {/* ── Billing toggle ── */}
      <div className="flex justify-center mb-12">
        <div
          className="inline-flex items-center rounded-full p-1.5 border border-white/10 backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer ${
              !isAnnual
                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                : "text-white/50 hover:text-white/70"
            }`}
            style={!isAnnual ? { boxShadow: "0 4px 20px rgba(245,166,35,0.25)" } : undefined}
          >
            {labels.monthly}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
              isAnnual
                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                : "text-white/50 hover:text-white/70"
            }`}
            style={isAnnual ? { boxShadow: "0 4px 20px rgba(245,166,35,0.25)" } : undefined}
          >
            {labels.annual}
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{
                background: isAnnual ? "rgba(27,58,75,0.25)" : "rgba(245,166,35,0.15)",
                color: isAnnual ? "var(--color-accent-text)" : "var(--color-accent)",
              }}
            >
              {labels.save}
            </span>
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <p className="text-sm text-red-400 text-center mb-6" role="alert">
          {error}
        </p>
      )}

      {/* ── Pricing cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[920px] mx-auto">

        {/* ── Créateurs (popular) ── */}
        <div className="relative group">
          {/* Gradient border */}
          <div
            className="absolute -inset-px rounded-2xl"
            style={{
              background: "linear-gradient(180deg, rgba(245,166,35,0.6) 0%, rgba(245,166,35,0.15) 100%)",
            }}
          />
          {/* Soft glow on hover */}
          <div
            className="absolute -inset-px rounded-2xl blur-xl transition-opacity duration-500 opacity-[0.15] group-hover:opacity-[0.3]"
            style={{ background: "rgba(245,166,35,0.6)" }}
          />

          <div
            className="relative rounded-2xl p-8 h-full flex flex-col"
            style={{ background: "var(--color-bg-secondary)" }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6 self-start"
              style={{ background: "rgba(245,166,35,0.12)", color: "var(--color-accent)" }}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {creatorsData.badge}
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2">{creatorsData.name}</h2>
            <p className="text-sm text-white/50 mb-8 leading-relaxed">{creatorsData.description}</p>

            {/* Price */}
            <div className="mb-3">
              <span className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {isAnnual ? creatorsData.annualPrice : creatorsData.monthlyPrice}
              </span>
              <span className="text-white/40 text-sm ml-1.5">
                {isAnnual ? perYear : perMonth}
              </span>
            </div>

            {/* Trust signals — risk reversal next to the price */}
            <ul className="space-y-1.5 mb-7 text-[0.8125rem] text-white/65">
              <li className="flex items-start gap-2">
                <CheckIcon />
                <span>{trustLabels.noCommitment}</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon />
                <span>{trustLabels.moneyBack}</span>
              </li>
            </ul>

            {/* CTA */}
            <button
              onClick={handleSubscribeCreators}
              disabled={loadingPlan !== null}
              className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer
                text-[var(--color-accent-text)] border-0
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                mb-2"
              style={{
                background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
                boxShadow: "0 4px 24px rgba(245,166,35,0.25)",
              }}
            >
              {loadingPlan === "creators_monthly" || loadingPlan === "creators_annual" ? "..." : subscribeLabel}
            </button>

            {/* Secure payment reassurance below CTA */}
            <p className="flex items-center justify-center gap-1.5 text-[0.6875rem] text-white/35 mb-6">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {trustLabels.securePayment}
            </p>

            {/* Divider */}
            <div className="h-px bg-white/10 mb-6" />

            {/* Features */}
            <ul className="space-y-4 mt-auto">
              {creatorsData.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[0.9rem] text-white/70">
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Boutique ── */}
        <div
          className="rounded-2xl p-8 h-full flex flex-col border border-white/[0.08] transition-all duration-500
            hover:border-white/[0.15]"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {/* Badge */}
          <div
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border border-white/10 mb-6 self-start"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
          >
            {boutiqueData.badge}
          </div>

          <h2 className="text-2xl font-extrabold text-white mb-2">{boutiqueData.name}</h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">{boutiqueData.description}</p>

          {/* Price */}
          <div className="mb-3">
            <span className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              {boutiqueData.annualPrice}
            </span>
            <span className="text-white/40 text-sm ml-1.5">{perYear}</span>
          </div>

          {/* Trust signals */}
          <ul className="space-y-1.5 mb-7 text-[0.8125rem] text-white/65">
            <li className="flex items-start gap-2">
              <CheckIcon />
              <span>{trustLabels.noCommitment}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon />
              <span>{trustLabels.moneyBack}</span>
            </li>
          </ul>

          {/* CTA */}
          <button
            onClick={handleSubscribeBoutique}
            disabled={loadingPlan !== null}
            className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer
              text-white border border-white/[0.12]
              hover:border-white/[0.2] hover:scale-[1.02]
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
              mb-2"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {loadingPlan === "boutique_annual" ? "..." : subscribeLabel}
          </button>

          {/* Secure payment reassurance */}
          <p className="flex items-center justify-center gap-1.5 text-[0.6875rem] text-white/35 mb-6">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {trustLabels.securePayment}
          </p>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-6" />

          {/* Features */}
          <ul className="space-y-4 mt-auto">
            {boutiqueData.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[0.9rem] text-white/70">
                <CheckIcon />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Confirmation modal — pre-Stripe value recap + guarantees ── */}
      {confirmingPlan && (() => {
        const details = getConfirmationDetails(confirmingPlan);
        const isLoading = loadingPlan === confirmingPlan;
        return (
          <>
            {/* Backdrop */}
            <div
              onClick={dismissConfirmation}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(4px)",
                zIndex: 200,
                animation: "boutiquePopupFadeIn 0.25s ease",
              }}
            />
            {/* Modal */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="checkout-confirm-title"
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 201,
                width: "92%",
                maxWidth: 460,
                backgroundColor: "white",
                borderRadius: 16,
                padding: "2rem 1.75rem 1.5rem",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
                animation: "boutiquePopupSlideUp 0.25s ease",
              }}
            >
              {/* Plan recap */}
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#9ca3af",
                  textAlign: "center",
                  margin: "0 0 0.375rem",
                }}
              >
                {details.name}
              </p>
              <h2
                id="checkout-confirm-title"
                style={{
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  color: "#1b3a4b",
                  textAlign: "center",
                  margin: "0 0 0.25rem",
                  lineHeight: 1.15,
                }}
              >
                {confirmLabels.title}
              </h2>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--color-accent)",
                  margin: "0.5rem 0 0.875rem",
                }}
              >
                {details.price}
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#9ca3af", marginLeft: 4 }}>
                  {details.period}
                </span>
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  textAlign: "center",
                  margin: "0 0 1.25rem",
                }}
              >
                {confirmLabels.desc}
              </p>

              {/* Value bullets */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                {[confirmLabels.bullet1, confirmLabels.bullet2, confirmLabels.bullet3, confirmLabels.bullet4].map((b) => (
                  <li
                    key={b}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.625rem",
                      fontSize: "0.875rem",
                      color: "#374151",
                      lineHeight: 1.45,
                    }}
                  >
                    <CheckIcon />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Continue CTA */}
              <button
                onClick={() => continueToStripe(confirmingPlan)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-text)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  borderRadius: 9999,
                  border: "none",
                  cursor: isLoading ? "wait" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  marginBottom: "0.625rem",
                  fontFamily: "inherit",
                }}
              >
                {isLoading ? "..." : `${confirmLabels.cta} →`}
              </button>

              {/* Secure payment line */}
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  fontSize: "0.6875rem",
                  color: "#9ca3af",
                  margin: "0 0 0.75rem",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {confirmLabels.secure}
              </p>

              {/* Cancel link */}
              <button
                onClick={dismissConfirmation}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  cursor: isLoading ? "wait" : "pointer",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                }}
              >
                {confirmLabels.cancel}
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
