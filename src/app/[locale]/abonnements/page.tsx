import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import PricingToggle from "./PricingToggle";
import { buildMetadata, BASE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Abonnements" : "Pricing",
    description:
      locale === "fr"
        ? "Accédez à 300+ morceaux originaux libres de droit. Offres Créateurs dès 15,99 €/mois et Boutique à 99,99 €/an."
        : "Access 300+ original royalty-free tracks. Creators plans from €15.99/month and Boutique at €99.99/year.",
    locale,
    pagePath: "/abonnements",
  });
}

export default async function AbonnementsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("pricing");

  const creatorsFeatures = [
    t("creators.features.0"),
    t("creators.features.1"),
    t("creators.features.2"),
    t("creators.features.3"),
    t("creators.features.4"),
  ];

  const boutiqueFeatures = [
    t("boutique.features.0"),
    t("boutique.features.1"),
    t("boutique.features.2"),
    t("boutique.features.3"),
  ];

  return (
    <div style={{ padding: "4rem 1.5rem", maxWidth: "1100px", margin: "0 auto" }}>
      <h1
        style={{
          fontWeight: 800,
          fontSize: "clamp(2rem, 4vw, 3rem)",
          textAlign: "center",
          marginBottom: "1rem",
        }}
      >
        {t("title")}
      </h1>

      <PricingToggle
        locale={locale}
        labels={{ monthly: t("monthly"), annual: t("annual"), save: t("save", { percent: "38" }) }}
        creatorsData={{
          name: t("creators.name"),
          description: t("creators.description"),
          monthlyPrice: t("creators.monthly_price"),
          annualPrice: t("creators.annual_price"),
          features: creatorsFeatures,
          badge: t("mostPopular"),
        }}
        boutiqueData={{
          name: t("boutique.name"),
          description: t("boutique.description"),
          annualPrice: t("boutique.annual_price"),
          features: boutiqueFeatures,
          badge: t("onlyAnnual"),
        }}
        subscribeLabel={t("subscribe")}
        perMonth={t("perMonth")}
        perYear={t("perYear")}
      />

      <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)", marginTop: "2rem" }}>
        <a href={`/${locale}/cgv`} style={{ color: "var(--color-text-muted)" }}>CGV</a>
        {" · "}
        <a href={`/${locale}/mentions-legales`} style={{ color: "var(--color-text-muted)" }}>Mentions légales</a>
      </p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  "@type": "Product",
                  name: `Lalason ${t("creators.name")} — ${t("monthly")}`,
                  description: t("creators.description"),
                  url: `${BASE_URL}/${locale}/abonnements`,
                  offers: {
                    "@type": "Offer",
                    price: "15.99",
                    priceCurrency: "EUR",
                    availability: "https://schema.org/InStock",
                  },
                },
              },
              {
                "@type": "ListItem",
                position: 2,
                item: {
                  "@type": "Product",
                  name: `Lalason ${t("creators.name")} — ${t("annual")}`,
                  description: t("creators.description"),
                  url: `${BASE_URL}/${locale}/abonnements`,
                  offers: {
                    "@type": "Offer",
                    price: "99.00",
                    priceCurrency: "EUR",
                    availability: "https://schema.org/InStock",
                  },
                },
              },
              {
                "@type": "ListItem",
                position: 3,
                item: {
                  "@type": "Product",
                  name: `Lalason ${t("boutique.name")} — ${t("annual")}`,
                  description: t("boutique.description"),
                  url: `${BASE_URL}/${locale}/abonnements`,
                  offers: {
                    "@type": "Offer",
                    price: "99.99",
                    priceCurrency: "EUR",
                    availability: "https://schema.org/InStock",
                  },
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
