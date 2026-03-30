"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type PlanType = "creators_monthly" | "creators_annual" | "boutique_annual";

async function startCheckout(planType: PlanType, locale: string) {
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
  }
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

  async function handleSubscribe(planType: PlanType) {
    setLoadingPlan(planType);
    await startCheckout(planType, locale);
    setLoadingPlan(null);
  }

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "3rem" }}>
        <span style={{ fontSize: "0.9375rem", fontWeight: isAnnual ? 400 : 600, color: isAnnual ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
          {labels.monthly}
        </span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          style={{
            position: "relative",
            width: "48px",
            height: "26px",
            borderRadius: "9999px",
            border: "none",
            backgroundColor: isAnnual ? "var(--color-accent)" : "var(--color-border)",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          aria-label="Toggle billing period"
        >
          <span
            style={{
              position: "absolute",
              top: "3px",
              left: isAnnual ? "23px" : "3px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "white",
              transition: "left 0.2s",
            }}
          />
        </button>
        <span style={{ fontSize: "0.9375rem", fontWeight: isAnnual ? 600 : 400, color: isAnnual ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
          {labels.annual}
          {isAnnual && (
            <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", backgroundColor: "var(--color-accent)", color: "var(--color-accent-text)", padding: "0.125rem 0.5rem", borderRadius: "9999px", fontWeight: 600 }}>
              {labels.save}
            </span>
          )}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        {/* Créateurs */}
        <div style={{
          padding: "2rem",
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "2px solid var(--color-accent)",
          position: "relative",
        }}>
          <span style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "0.25rem 0.875rem",
            borderRadius: "9999px",
            whiteSpace: "nowrap",
          }}>
            {creatorsData.badge}
          </span>

          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>{creatorsData.name}</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>{creatorsData.description}</p>

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontWeight: 800, fontSize: "2.5rem" }}>
              {isAnnual ? creatorsData.annualPrice : creatorsData.monthlyPrice}
            </span>
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginLeft: "0.25rem" }}>
              {isAnnual ? perYear : perMonth}
            </span>
          </div>

          <button
            onClick={() => handleSubscribe(isAnnual ? "creators_annual" : "creators_monthly")}
            disabled={loadingPlan !== null}
            style={{
              display: "block",
              width: "100%",
              padding: "0.875rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: "var(--radius-full)",
              textAlign: "center",
              border: "none",
              cursor: loadingPlan !== null ? "not-allowed" : "pointer",
              marginBottom: "1.5rem",
              opacity: loadingPlan === (isAnnual ? "creators_annual" : "creators_monthly") ? 0.7 : 1,
            }}
          >
            {loadingPlan === (isAnnual ? "creators_annual" : "creators_monthly") ? "..." : subscribeLabel}
          </button>

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {creatorsData.features.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "1px" }}>✓</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Boutique */}
        <div style={{
          padding: "2rem",
          backgroundColor: "var(--color-bg-card)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          position: "relative",
        }}>
          <span style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--color-bg-secondary)",
            color: "var(--color-text-muted)",
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.875rem",
            borderRadius: "9999px",
            border: "1px solid var(--color-border)",
            whiteSpace: "nowrap",
          }}>
            {boutiqueData.badge}
          </span>

          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "0.5rem" }}>{boutiqueData.name}</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>{boutiqueData.description}</p>

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={{ fontWeight: 800, fontSize: "2.5rem" }}>{boutiqueData.annualPrice}</span>
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginLeft: "0.25rem" }}>{perYear}</span>
          </div>

          <button
            onClick={() => handleSubscribe("boutique_annual")}
            disabled={loadingPlan !== null}
            style={{
              display: "block",
              width: "100%",
              padding: "0.875rem",
              backgroundColor: "transparent",
              color: "var(--color-text-primary)",
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: "var(--radius-full)",
              textAlign: "center",
              border: "1px solid var(--color-border)",
              cursor: loadingPlan !== null ? "not-allowed" : "pointer",
              marginBottom: "1.5rem",
              opacity: loadingPlan === "boutique_annual" ? 0.7 : 1,
            }}
          >
            {loadingPlan === "boutique_annual" ? "..." : subscribeLabel}
          </button>

          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {boutiqueData.features.map((f) => (
              <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--color-accent)", flexShrink: 0, marginTop: "1px" }}>✓</span>
                <span style={{ color: "var(--color-text-secondary)" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
