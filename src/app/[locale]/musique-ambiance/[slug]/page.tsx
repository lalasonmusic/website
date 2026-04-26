import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getBoutiquePlaylists, getBoutiquePlaylistBySlug } from "@/lib/playlists/queries";
import { getUserAccess } from "@/lib/subscriptions/access";
import { resolveSlugToDb, resolveDbToSlug, getAllSlugsForLocale } from "@/lib/boutique/slug-mapping";
import BoutiquePlaylistCard from "@/components/boutique/BoutiquePlaylistCard";
import BoutiqueTrackList from "@/components/boutique/BoutiqueTrackList";
import EmptyPlaylistState from "@/components/boutique/EmptyPlaylistState";
import PreviewEndedToast from "@/components/boutique/PreviewEndedToast";
import PlayerContextInit from "@/components/boutique/PlayerContextInit";
import BoutiqueSubscriptionPopup from "@/components/boutique/BoutiqueSubscriptionPopup";
import { Link } from "@/i18n/navigation";
import { BASE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export const dynamicParams = false; // 404 sur slug inconnu
export const revalidate = 3600;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const localeTyped = params.locale === "en" ? "en" : "fr";
  return getAllSlugsForLocale(localeTyped).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const localeTyped = locale === "en" ? "en" : "fr";
  const dbSlug = resolveSlugToDb(slug, localeTyped);
  if (!dbSlug) return { title: "Not found" };

  const playlist = await getBoutiquePlaylistBySlug(dbSlug);
  if (!playlist) return { title: "Not found" };

  const name = localeTyped === "en" ? playlist.nameEn : playlist.nameFr;
  const description = localeTyped === "en" ? playlist.descriptionEn : playlist.descriptionFr;

  const frSlug = resolveDbToSlug(dbSlug, "fr") ?? dbSlug;
  const enSlug = resolveDbToSlug(dbSlug, "en") ?? dbSlug;
  const frUrl = `${BASE_URL}/fr/musique-ambiance/${frSlug}`;
  const enUrl = `${BASE_URL}/en/ambient-music/${enSlug}`;
  const canonical = localeTyped === "en" ? enUrl : frUrl;

  return {
    title: name,
    description: description ?? undefined,
    alternates: {
      canonical,
      languages: { fr: frUrl, en: enUrl, "x-default": frUrl },
    },
    openGraph: {
      title: `${name} | Lalason`,
      description: description ?? undefined,
      url: canonical,
      siteName: "Lalason",
      locale: localeTyped === "fr" ? "fr_FR" : "en_US",
      type: "website",
    },
  };
}

export default async function MusiqueAmbianceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const localeTyped = locale === "en" ? "en" : "fr";
  const t = await getTranslations({ locale, namespace: "boutique" });

  const dbSlug = resolveSlugToDb(slug, localeTyped);
  if (!dbSlug) notFound();

  const [playlist, allPlaylists, supabase] = await Promise.all([
    getBoutiquePlaylistBySlug(dbSlug),
    getBoutiquePlaylists(),
    createClient(),
  ]);
  if (!playlist) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const access = await getUserAccess(user?.id);

  const name = localeTyped === "en" ? playlist.nameEn : playlist.nameFr;
  const description = localeTyped === "en" ? playlist.descriptionEn : playlist.descriptionFr;
  const segment = localeTyped === "en" ? "ambient-music" : "musique-ambiance";
  const localeSlug = resolveDbToSlug(dbSlug, localeTyped) ?? dbSlug;

  // 3 other playlists for cross-navigation (exclude current)
  const otherPlaylists = allPlaylists
    .filter((p) => p.id !== playlist.id)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name,
    description,
    url: `${BASE_URL}/${localeTyped}/${segment}/${localeSlug}`,
    numTracks: playlist.tracks.length,
    track: playlist.tracks.map((tr) => ({
      "@type": "MusicRecording",
      name: tr.title,
      byArtist: { "@type": "MusicGroup", name: tr.artistName },
      duration: tr.durationSeconds ? `PT${tr.durationSeconds}S` : undefined,
    })),
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "0 0 4rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PlayerContextInit hasBoutiqueAccess={access.hasBoutiqueAccess} />
      <PreviewEndedToast />

      {/* Hero header with gradient */}
      <header
        style={{
          background: playlist.gradient,
          padding: "3rem 1.5rem 2.5rem",
          color: "white",
          textAlign: "center",
        }}
      >
        <Link
          href={{ pathname: "/musique-ambiance" }}
          style={{
            display: "inline-block",
            fontSize: "0.8125rem",
            color: "rgba(255,255,255,0.85)",
            textDecoration: "none",
            marginBottom: "1.5rem",
          }}
        >
          ← {t("playlist.backToHub")}
        </Link>
        {playlist.emoji && (
          <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "1rem" }}>
            {playlist.emoji}
          </div>
        )}
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            color: "white",
            margin: "0 0 1rem",
            lineHeight: 1.15,
          }}
        >
          {name}
        </h1>
        {description && (
          <p
            style={{
              fontSize: "1rem",
              color: "rgba(255,255,255,0.9)",
              maxWidth: 640,
              margin: "0 auto 1.5rem",
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        )}
        <a
          href={`/${localeTyped}/abonnements#boutique`}
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "white",
            color: "#1b3a4b",
            fontWeight: 700,
            fontSize: "0.9375rem",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
          }}
        >
          {t("playlist.ctaPrimary")}
        </a>
      </header>

      {/* Tracks */}
      <section style={{ padding: "2rem 1rem" }}>
        {playlist.tracks.length === 0 ? (
          <EmptyPlaylistState />
        ) : (
          <BoutiqueTrackList
            tracks={playlist.tracks}
            playlistName={name}
            playlistEmoji={playlist.emoji}
          />
        )}
      </section>

      {/* Bottom CTA */}
      <section
        style={{
          padding: "2rem 1.5rem",
          textAlign: "center",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <a
          href={`/${localeTyped}/abonnements#boutique`}
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
          {t("playlist.ctaPrimary")}
        </a>
      </section>

      {/* Related playlists */}
      {otherPlaylists.length > 0 && (
        <section style={{ padding: "2rem 1.5rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 1.25rem",
            }}
          >
            {t("playlist.relatedTitle")}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {otherPlaylists.map((p) => (
              <BoutiquePlaylistCard
                key={p.id}
                dbSlug={p.slug}
                name={localeTyped === "en" ? p.nameEn : p.nameFr}
                description={localeTyped === "en" ? p.descriptionEn : p.descriptionFr}
                gradient={p.gradient}
                emoji={p.emoji}
                trackCount={p.trackCount}
                locale={localeTyped}
              />
            ))}
          </div>
        </section>
      )}

      <BoutiqueSubscriptionPopup
        hasBoutiqueAccess={access.hasBoutiqueAccess}
        locale={localeTyped}
      />
    </main>
  );
}
