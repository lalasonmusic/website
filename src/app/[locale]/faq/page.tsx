import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return buildMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
    locale,
    pagePath: "/faq",
  });
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  void locale;
  const t = await getTranslations("faq");

  const questions: { q: string; a: string }[] = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
    { q: t("q5"), a: t("a5") },
    { q: t("q6"), a: t("a6") },
    { q: t("q7"), a: t("a7") },
  ];

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.75rem)", marginBottom: "0.75rem" }}>
        {t("pageTitle")}
      </h1>
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "1.0625rem",
          marginBottom: "3rem",
        }}
      >
        {t("pageDescription")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {questions.map((item, i) => (
          <details
            key={i}
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <summary
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
                listStyle: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              {item.q}
              <span style={{ color: "var(--color-accent)", flexShrink: 0, fontSize: "1.25rem" }}>+</span>
            </summary>
            <p
              style={{
                marginTop: "1rem",
                color: "var(--color-text-secondary)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
