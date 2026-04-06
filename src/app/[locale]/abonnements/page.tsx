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
        ? "Accédez à des milliers de morceaux originaux libres de droit. Offres Créateurs dès 15,99 €/mois et Boutique à 99,99 €/an."
        : "Access thousands of original royalty-free tracks. Creators plans from €15.99/month and Boutique at €99.99/year.",
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Decorative background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,166,35,0.06) 0%, transparent 70%)" }}
      />

      {/* Hero */}
      <section className="relative pt-24 pb-4 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          {t("title")}
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
      </section>

      {/* Pricing */}
      <section className="relative px-4 md:px-6 pt-8 pb-20">
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
      </section>

      {/* Footer links */}
      <div className="text-center pb-12">
        <p className="text-sm text-white/30">
          <a href={`/${locale}/cgv`} className="hover:text-white/50 transition-colors">CGV</a>
          <span className="mx-2">·</span>
          <a href={`/${locale}/mentions-legales`} className="hover:text-white/50 transition-colors">
            Mentions légales
          </a>
        </p>
      </div>

      {/* JSON-LD structured data */}
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
