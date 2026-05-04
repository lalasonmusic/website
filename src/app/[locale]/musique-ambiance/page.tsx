import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getBoutiquePlaylists } from "@/lib/playlists/queries";
import { getUserAccess } from "@/lib/subscriptions/access";
import { resolveDbToSlug } from "@/lib/boutique/slug-mapping";
import BoutiquePlaylistCard from "@/components/boutique/BoutiquePlaylistCard";
import BoutiqueCarousel from "@/components/boutique/BoutiqueCarousel";
import BoutiqueSubscriptionPopup from "@/components/boutique/BoutiqueSubscriptionPopup";
import { Link } from "@/i18n/navigation";
import { BASE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

// SSG with revalidate 1h (boutique playlists are stable, content updated occasionally)
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "boutique.hub" });

  const frUrl = `${BASE_URL}/fr/musique-ambiance`;
  const enUrl = `${BASE_URL}/en/ambient-music`;
  const canonical = locale === "en" ? enUrl : frUrl;

  return {
    title: t("title"),
    description: t("intro"),
    alternates: {
      canonical,
      languages: {
        fr: frUrl,
        en: enUrl,
        "x-default": frUrl,
      },
    },
    openGraph: {
      title: `${t("title")} | Lalason`,
      description: t("intro"),
      url: canonical,
      siteName: "Lalason",
      locale: locale === "fr" ? "fr_FR" : "en_US",
      type: "website",
    },
  };
}

export default async function MusiqueAmbianceHubPage({ params }: Props) {
  const { locale } = await params;
  const localeTyped = locale === "en" ? "en" : "fr";
  const t = await getTranslations({ locale, namespace: "boutique" });

  const [playlists, supabase] = await Promise.all([
    getBoutiquePlaylists(),
    createClient(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();
  const access = await getUserAccess(user?.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("hub.title"),
    description: t("hub.intro"),
    url: locale === "en"
      ? `${BASE_URL}/en/ambient-music`
      : `${BASE_URL}/fr/musique-ambiance`,
    hasPart: playlists.map((p) => {
      const localeSlug = resolveDbToSlug(p.slug, localeTyped) ?? p.slug;
      const segment = localeTyped === "en" ? "ambient-music" : "musique-ambiance";
      return {
        "@type": "MusicPlaylist",
        name: localeTyped === "en" ? p.nameEn : p.nameFr,
        description: localeTyped === "en" ? p.descriptionEn : p.descriptionFr,
        url: `${BASE_URL}/${localeTyped}/${segment}/${localeSlug}`,
        numTracks: p.trackCount,
      };
    }),
  };

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "3rem 1.5rem 4rem",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            margin: "0 0 1rem",
            lineHeight: 1.15,
          }}
        >
          {t("hub.title")}
        </h1>
        <p
          style={{
            fontSize: "1rem",
            color: "var(--color-text-secondary)",
            maxWidth: 720,
            margin: "0 auto 1.5rem",
            lineHeight: 1.55,
          }}
        >
          {t("hub.intro")}
        </p>
        <Link
          href={{ pathname: "/abonnements" }}
          style={{
            display: "inline-block",
            padding: "0.875rem 1.75rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
          }}
        >
          {t("hub.cta")}
        </Link>
      </header>

      {/* 7 playlists in a horizontal carousel: ~3-4 visible + edge peek to signal more */}
      <BoutiqueCarousel>
        {playlists.map((p) => (
          <BoutiquePlaylistCard
            key={p.id}
            dbSlug={p.slug}
            name={localeTyped === "en" ? p.nameEn : p.nameFr}
            gradient={p.gradient}
            trackCount={p.trackCount}
            locale={localeTyped}
          />
        ))}
      </BoutiqueCarousel>

      <BoutiqueSubscriptionPopup
        hasBoutiqueAccess={access.hasBoutiqueAccess}
        locale={localeTyped}
      />
    </main>
  );
}
