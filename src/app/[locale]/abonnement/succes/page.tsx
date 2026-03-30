import { getTranslations } from "next-intl/server";
import SubscriptionActiveTracker from "@/components/analytics/SubscriptionActiveTracker";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AbonnementSuccesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("pricing");

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <SubscriptionActiveTracker />
      <div style={{ textAlign: "center", maxWidth: "480px" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }}>🎉</div>
        <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: "1rem" }}>
          {t("successTitle")}
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "1.0625rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          {t("successDesc")}
        </p>
        <a
          href={`/${locale}/catalogue`}
          style={{
            display: "inline-block",
            padding: "0.875rem 2rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 600,
            fontSize: "1rem",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
          }}
        >
          {t("successCta")}
        </a>
      </div>
    </div>
  );
}
