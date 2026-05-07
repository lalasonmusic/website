import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getBoutiquePlaylists, getBoutiquePlaylistBySlug } from "@/lib/playlists/queries";
import { getUserAccess } from "@/lib/subscriptions/access";
import { resolveSlugToDb, resolveDbToSlug, getAllSlugsForLocale } from "@/lib/boutique/slug-mapping";
import Image from "next/image";
import BoutiquePlaylistCard from "@/components/boutique/BoutiquePlaylistCard";
import { getBoutiqueIcon } from "@/components/boutique/playlist-icons";
import { getBoutiqueImage } from "@/lib/boutique/playlist-images";
import BoutiqueTrackList from "@/components/boutique/BoutiqueTrackList";
import { Check } from "lucide-react";
import EmptyPlaylistState from "@/components/boutique/EmptyPlaylistState";
import PreviewEndedToast from "@/components/boutique/PreviewEndedToast";
import PlayerContextInit from "@/components/boutique/PlayerContextInit";
import BoutiqueSubscriptionPopup from "@/components/boutique/BoutiqueSubscriptionPopup";
import { Link } from "@/i18n/navigation";
import { BASE_URL, buildDynamicOgUrl } from "@/lib/seo";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb";

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

  // Build a dynamic OG image with the same Unsplash photo + duotone-style
  // typography overlay. Eyebrow surfaces the section so shares read as part
  // of a curated collection, not a random page.
  const eyebrow = localeTyped === "en" ? "Ambient Music" : "Musique d'ambiance";
  const ogImageUrl = buildDynamicOgUrl({
    title: name,
    eyebrow,
    image: getBoutiqueImage(dbSlug) ?? undefined,
  });

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
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Lalason`,
      description: description ?? undefined,
      images: [ogImageUrl],
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

  const heroImage = getBoutiqueImage(dbSlug);
  const heroIcon = getBoutiqueIcon(dbSlug);
  const totalSeconds = playlist.tracks.reduce((sum, tr) => sum + (tr.durationSeconds ?? 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const demoTrack = playlist.tracks.find((tr) => tr.isDemo);
  const trackCountLabel =
    playlist.tracks.length === 0
      ? t("playlist.trackCountEmpty")
      : playlist.tracks.length === 1
        ? t("playlist.trackCountSingular")
        : t("playlist.trackCount", { count: playlist.tracks.length });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(localeTyped, [
    {
      name: localeTyped === "en" ? "Ambient Music" : "Musique d'ambiance",
      path: localeTyped === "en" ? "/ambient-music" : "/musique-ambiance",
    },
    { name, path: `/${segment}/${localeSlug}` },
  ]);

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
    <main style={{ padding: "0 0 4rem" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PlayerContextInit hasBoutiqueAccess={access.hasBoutiqueAccess} />
      <PreviewEndedToast />

      {/* ── Editorial Hero (full-bleed photo + duotone tint, ~60vh) ── */}
      <header
        style={{
          position: "relative",
          width: "100%",
          minHeight: "min(560px, 60vh)",
          background: playlist.gradient,
          color: "white",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {/* Photo full-bleed (grayscale) — LCP element on this page */}
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            style={{
              objectFit: "cover",
              filter: "grayscale(1)",
            }}
          />
        )}
        {/* Coloured tint (duotone) */}
        {heroImage && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: playlist.gradient,
              mixBlendMode: "multiply",
              opacity: 0.55,
            }}
          />
        )}
        {/* Bottom dark gradient for text legibility */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Foreground content */}
        <div
          style={{
            position: "relative",
            maxWidth: 1100,
            margin: "0 auto",
            padding: "1.75rem 1.5rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "min(560px, 60vh)",
          }}
        >
          {/* Top row: breadcrumb + discrete subscribe link */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <Link
              href={{ pathname: "/musique-ambiance" }}
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              ← {t("playlist.backToHub")}
            </Link>
            <a
              href={`/${localeTyped}/abonnements#boutique`}
              style={{
                fontSize: "0.8125rem",
                color: "white",
                textDecoration: "underline",
                textUnderlineOffset: 4,
                fontWeight: 600,
              }}
            >
              {t("hub.cta")}
            </a>
          </div>

          {/* Title block: pinned bottom-left */}
          <div style={{ maxWidth: 720 }}>
            {heroIcon && (
              <div
                style={{
                  display: "inline-flex",
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: "white",
                }}
              >
                {heroIcon}
              </div>
            )}
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                color: "white",
                margin: "0 0 0.875rem",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 16px rgba(0,0,0,0.25)",
              }}
            >
              {name}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: 600,
                  margin: "0 0 1rem",
                  lineHeight: 1.6,
                  textShadow: "0 1px 8px rgba(0,0,0,0.3)",
                }}
              >
                {description}
              </p>
            )}
            {/* Compact metadata strip */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 500,
                flexWrap: "wrap",
              }}
            >
              <span>{trackCountLabel}</span>
              {totalMinutes > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>~{totalMinutes} min</span>
                </>
              )}
              {demoTrack && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {localeTyped === "en" ? "Demo: " : "Démo : "}
                    <strong style={{ color: "white" }}>{demoTrack.title}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Tracks ── */}
      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "2.5rem 1.5rem 1rem",
        }}
      >
        {playlist.tracks.length === 0 ? (
          <EmptyPlaylistState />
        ) : (
          <BoutiqueTrackList
            tracks={playlist.tracks}
            playlistName={name}
            playlistEmoji={playlist.emoji}
            playlistGradient={playlist.gradient}
          />
        )}
      </section>

      {/* ── Editorial CTA section (one only, conversion-focused) ── */}
      <section
        style={{
          maxWidth: 880,
          margin: "3rem auto 0",
          padding: "2.5rem 1.5rem",
          backgroundColor: "var(--color-bg-secondary)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "clamp(1.25rem, 2.5vw, 1.5rem)",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              margin: "0 0 0.625rem",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {localeTyped === "fr"
              ? "Diffusez Lalason dans votre établissement"
              : "Stream Lalason in your venue"}
          </h2>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-text-muted)",
              margin: "0 0 1.5rem",
              lineHeight: 1.55,
            }}
          >
            {localeTyped === "fr"
              ? "Accédez à toutes les playlists boutique en streaming illimité, sans coupure, sans publicité."
              : "Access every boutique playlist with unlimited streaming, no cuts, no ads."}
          </p>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              textAlign: "left",
              maxWidth: 380,
              marginInline: "auto",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <Check
                  size={16}
                  strokeWidth={2.5}
                  color="var(--color-accent)"
                  style={{ flexShrink: 0, marginTop: 3 }}
                />
                <span>{t(`popup.feature${i}` as never)}</span>
              </li>
            ))}
          </ul>
          <a
            href={`/${localeTyped}/abonnements#boutique`}
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 700,
              fontSize: "0.9375rem",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
            }}
          >
            {t("popup.ctaSubscribe")} · {t("popup.planPrice")}
            <span style={{ fontWeight: 500, opacity: 0.8 }}>{t("popup.planPeriod")}</span>
          </a>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "0.875rem 0 0",
            }}
          >
            {localeTyped === "fr"
              ? "Sans engagement · Annulation à tout moment"
              : "No commitment · Cancel anytime"}
          </p>
        </div>
      </section>

      {/* Related playlists */}
      {otherPlaylists.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 0" }}>
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
          <div className="boutique-playlist-grid">
            {otherPlaylists.map((p) => (
              <BoutiquePlaylistCard
                key={p.id}
                dbSlug={p.slug}
                name={localeTyped === "en" ? p.nameEn : p.nameFr}
                description={localeTyped === "en" ? p.descriptionEn : p.descriptionFr}
                gradient={p.gradient}
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
        playlistName={name}
      />
    </main>
  );
}
