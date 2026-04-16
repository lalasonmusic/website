"use client";

import { useState } from "react";
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
}: Props) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(planType: PlanType) {
    setLoadingPlan(planType);
    setError(null);
    try {
      await startCheckout(planType, locale, setError);
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    }
    setLoadingPlan(null);
  }

  // Read the current toggle state at click-time to avoid stale closure issues
  // where a re-render between click and effect could send the wrong plan.
  function handleSubscribeCreators() {
    const planType: PlanType = isAnnual ? "creators_annual" : "creators_monthly";
    handleSubscribe(planType);
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
            <div className="mb-8">
              <span className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {isAnnual ? creatorsData.annualPrice : creatorsData.monthlyPrice}
              </span>
              <span className="text-white/40 text-sm ml-1.5">
                {isAnnual ? perYear : perMonth}
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribeCreators}
              disabled={loadingPlan !== null}
              className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer
                text-[var(--color-accent-text)] border-0
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                mb-8"
              style={{
                background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
                boxShadow: "0 4px 24px rgba(245,166,35,0.25)",
              }}
            >
              {loadingPlan === "creators_monthly" || loadingPlan === "creators_annual" ? "..." : subscribeLabel}
            </button>

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
          <div className="mb-8">
            <span className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              {boutiqueData.annualPrice}
            </span>
            <span className="text-white/40 text-sm ml-1.5">{perYear}</span>
          </div>

          {/* CTA */}
          <button
            onClick={() => handleSubscribe("boutique_annual")}
            disabled={loadingPlan !== null}
            className="w-full py-3.5 rounded-xl font-semibold text-base transition-all duration-300 cursor-pointer
              text-white border border-white/[0.12]
              hover:border-white/[0.2] hover:scale-[1.02]
              active:scale-[0.98]
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
              mb-8"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {loadingPlan === "boutique_annual" ? "..." : subscribeLabel}
          </button>

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
    </div>
  );
}
