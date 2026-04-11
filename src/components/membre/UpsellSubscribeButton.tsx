"use client";

import { useState } from "react";

type PlanType = "creators_annual" | "boutique_annual";

type Props = {
  planType: PlanType;
  locale: string;
  label: string;
  variant: "primary" | "secondary";
};

export default function UpsellSubscribeButton({ planType, locale, label, variant }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
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
        return;
      }

      setError(data.error ?? `Erreur inattendue (HTTP ${res.status})`);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
      setLoading(false);
    }
  }

  const isPrimary = variant === "primary";

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`block w-full py-3.5 rounded-xl font-semibold text-base text-center transition-all duration-300 mb-2 ${
          isPrimary
            ? "text-[var(--color-accent-text)] hover:scale-[1.02] active:scale-[0.98]"
            : "text-white border border-white/[0.12] hover:border-white/[0.2] hover:scale-[1.02] active:scale-[0.98]"
        } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
        style={
          isPrimary
            ? { background: "linear-gradient(135deg, var(--color-accent) 0%, #e8961a 100%)", boxShadow: "0 4px 24px rgba(245,166,35,0.25)" }
            : { background: "rgba(255,255,255,0.06)" }
        }
      >
        {loading ? "..." : label}
      </button>
      {error && (
        <p className="text-xs text-red-400 mb-5 text-center" role="alert">
          {error}
        </p>
      )}
      {!error && <div className="mb-5" />}
    </>
  );
}
