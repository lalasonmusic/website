"use client";

import { useState } from "react";

type Props = {
  locale: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyLabel: string;
  annualLabel: string;
  saveLabel: string;
  perMonth: string;
  perYear: string;
  ctaLabel: string;
};

export default function UpsellCreatorsCard({
  locale,
  monthlyPrice,
  annualPrice,
  monthlyLabel,
  annualLabel,
  saveLabel,
  perMonth,
  perYear,
  ctaLabel,
}: Props) {
  const [isAnnual, setIsAnnual] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (loading) return;
    setLoading(true);
    const planType = isAnnual ? "creators_annual" : "creators_monthly";
    try {
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
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Billing toggle */}
      <div className="flex justify-center mb-5">
        <div
          className="inline-flex items-center rounded-full p-1 border border-white/10"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
              !isAnnual
                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {monthlyLabel}
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              isAnnual
                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {annualLabel}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{
                background: isAnnual ? "rgba(27,58,75,0.25)" : "rgba(245,166,35,0.15)",
                color: isAnnual ? "var(--color-accent-text)" : "var(--color-accent)",
              }}
            >
              {saveLabel}
            </span>
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="mb-7">
        <span className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          {isAnnual ? annualPrice : monthlyPrice}
        </span>
        <span className="text-white/40 text-sm ml-1.5">
          {isAnnual ? perYear : perMonth}
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="block w-full py-3.5 rounded-xl font-semibold text-base text-center transition-all duration-300 text-[var(--color-accent-text)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mb-7"
        style={{
          background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)",
          boxShadow: "0 4px 24px rgba(245,166,35,0.25)",
        }}
      >
        {loading ? "..." : ctaLabel}
      </button>
    </>
  );
}
