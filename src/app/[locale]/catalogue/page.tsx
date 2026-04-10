import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { trackService } from "@/lib/services/trackService";
import { db } from "@/db";
import { subscriptions, trackFavorites, tracks as tracksTable } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Suspense } from "react";
import CatalogueFilters from "@/components/catalogue/CatalogueFilters";
import TrackCard from "@/components/catalogue/TrackCard";
import SubscriptionPopup from "@/components/catalogue/SubscriptionPopup";
import type { TrackCategory } from "@/types/track";
import { buildMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; style?: string; theme?: string; mood?: string; page?: string }>;
};

// Always fetch fresh data — never serve a cached version of the catalogue
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TRACKS_PER_PAGE = 20;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Catalogue" : "Catalogue",
    description:
      locale === "fr"
        ? "Écoutez et téléchargez des milliers de morceaux originaux, libres de droit pour vos vidéos, podcasts et projets créatifs."
        : "Listen to and download thousands of original royalty-free tracks for your videos, podcasts and creative projects.",
    locale,
    pagePath: "/catalogue",
  });
}

export default async function CataloguePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, style, theme, mood, page: pageStr } = await searchParams;
  const t = await getTranslations("catalogue");

  const page = parseInt(pageStr ?? "1", 10);

  // Check subscription + plan type
  let isSubscribed = false;
  let canDownload = false;
  let favoriteIds = new Set<string>();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [sub] = await db
        .select({ id: subscriptions.id, planType: subscriptions.planType })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
        .limit(1);
      isSubscribed = !!sub;
      // Only Creators plans can download — Boutique is play-only
      canDownload = sub?.planType === "creators_monthly" || sub?.planType === "creators_annual";

      // Fetch favorites for Creators
      if (canDownload) {
        const favs = await db
          .select({ trackId: trackFavorites.trackId })
          .from(trackFavorites)
          .where(eq(trackFavorites.userId, user.id));
        favoriteIds = new Set(favs.map((f) => f.trackId));
      }
    }
  } catch {}

  // Fetch tracks + categories (separate queries with retry so one failure doesn't kill the other)
  async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T | null> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        console.error(`[catalogue] DB attempt ${i + 1}/${retries + 1} failed:`, err);
        if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
    return null;
  }

  let tracks: Awaited<ReturnType<typeof trackService.getPublished>>["tracks"] = [];
  let total = 0;
  let allCategories: Awaited<ReturnType<typeof trackService.getAllCategories>> = [];

  const [tracksResult, cats] = await Promise.all([
    withRetry(() => trackService.getPublished({ page, limit: TRACKS_PER_PAGE, search: q, style, theme, mood })),
    withRetry(() => trackService.getAllCategories()),
  ]);

  let isFallback = false;

  if (tracksResult) {
    tracks = tracksResult.tracks;
    total = tracksResult.total;
  }
  if (cats) {
    allCategories = cats;
  }

  // If search returned no results, show random tracks as suggestions
  if (tracks.length === 0 && (q || style || theme || mood)) {
    const fallbackResult = await withRetry(() => trackService.getPublished({ page: 1, limit: TRACKS_PER_PAGE }));
    if (fallbackResult && fallbackResult.tracks.length > 0) {
      tracks = fallbackResult.tracks;
      total = fallbackResult.total;
      isFallback = true;
    }
  }

  // Mark the 20 most-recently-uploaded published tracks with isNew=true so the
  // NEW badge is rank-based, not time-based. Once a 21st track lands, the
  // oldest one quietly loses its badge.
  const NEW_TOP_N = 20;
  const newestIds = await withRetry(() =>
    db
      .select({ id: tracksTable.id })
      .from(tracksTable)
      .where(eq(tracksTable.isPublished, true))
      .orderBy(desc(tracksTable.createdAt))
      .limit(NEW_TOP_N)
  );
  const newIdSet = new Set((newestIds ?? []).map((r) => r.id));
  tracks = tracks.map((t) => ({ ...t, isNew: newIdSet.has(t.id) }));

  const totalPages = isFallback ? 0 : Math.ceil(total / TRACKS_PER_PAGE);

  const filterCategories: TrackCategory[] = allCategories.map((c) => ({
    slug: c.slug,
    labelFr: c.labelFr,
    labelEn: c.labelEn,
    type: c.type as "STYLE" | "THEME" | "MOOD",
  }));

  const STYLE_OVERLAYS: Record<string, string> = {
    "chill-out": "rgba(15, 76, 117, 0.85)",
    "cinematique": "rgba(107, 15, 26, 0.82)",
    "electronique": "rgba(74, 26, 107, 0.82)",
    "funk-jazz": "rgba(168, 84, 18, 0.82)",
    "hip-hop-urban": "rgba(45, 27, 78, 0.82)",
    "lo-fi": "rgba(30, 70, 50, 0.85)",
    "pop-rock": "rgba(160, 40, 80, 0.82)",
    "world": "rgba(10, 80, 55, 0.85)",
  };
  const heroOverlay = (style && STYLE_OVERLAYS[style]) || "rgba(27, 58, 75, 0.82)";

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Hero banner — title + search + filters */}
      <section
        style={{
          position: "relative",
          backgroundImage: "url(/catalogue-hero.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "4rem 1.5rem 2.5rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: heroOverlay,
            transition: "background-color 0.4s ease",
          }}
        />
        <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
          {/* Quick link to favorites for Creators */}
          {canDownload && (
            <div style={{ marginBottom: "1.25rem" }}>
              <a
                href={`/${locale}/membre/favoris`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.5rem 1rem",
                  background: "rgba(245,166,35,0.12)",
                  color: "var(--color-accent)",
                  border: "1px solid rgba(245,166,35,0.3)",
                  borderRadius: 9999,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "inherit",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {locale === "fr" ? "Mes favoris" : "My favorites"}
              </a>
            </div>
          )}

          {/* Subtle value prop + CTA */}
          {!isSubscribed && (
            <p
              style={{
                fontFamily: "var(--font-poppins, Poppins, sans-serif)",
                fontSize: "0.9375rem",
                color: "rgba(255, 255, 255, 0.85)",
                margin: "0 0 1.5rem",
                lineHeight: 1.6,
              }}
            >
              {locale === "fr"
                ? "Des milliers de morceaux originaux — "
                : "Thousands of original tracks — "}
              <a
                href={`/${locale}/abonnements`}
                style={{
                  color: "var(--color-accent)",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {locale === "fr" ? "Accès illimité dès 99,99\u00A0€/an" : "Unlimited access from €99.99/year"}
              </a>
            </p>
          )}

          {/* Search + Theme/Mood filters */}
          <Suspense>
            <CatalogueFilters
              categories={filterCategories}
              searchPlaceholder={t("searchPlaceholder")}
              filterLabels={{
                style: t("filters.style"),
                theme: t("filters.theme"),
                mood: t("filters.mood"),
                all: t("filters.all"),
              }}
              locale={locale}
              darkMode
            />
          </Suspense>
        </div>
      </section>

      {/* Track section — soft background with gradient transition */}
      <div style={{
        background: "linear-gradient(to bottom, #e8edf0 0%, #f8f7f5 80px, #f8f7f5 100%)",
        color: "#1b3a4b",
        padding: "2.5rem 1.5rem 2.5rem",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>


          {/* Fallback suggestion banner */}
          {isFallback && (
            <div style={{
              textAlign: "center",
              padding: "1rem 0 1.5rem",
            }}>
              <p style={{ color: "#6b7280", fontSize: "0.9375rem", margin: 0 }}>
                {locale === "fr"
                  ? "Pas de résultat exact — voici des morceaux qui pourraient vous plaire :"
                  : "No exact match — here are some tracks you might like:"}
              </p>
            </div>
          )}

          {/* Track list */}
          {tracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p style={{ color: "#6b7280" }}>{t("noResults")}</p>
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                {t("noResultsSuggestion")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={tracks}
                  queueIndex={index}
                  locale={locale}
                  isSubscribed={isSubscribed}
                  canDownload={canDownload}
                  canFavorite={canDownload}
                  isFavorite={favoriteIds.has(track.id)}
                  activeFilterSlugs={[style, theme, mood].filter((s): s is string => !!s)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2.5rem" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...(q && { q }), ...(style && { style }), ...(theme && { theme }), ...(mood && { mood }), page: String(p) }).toString()}`}
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${p === page ? "var(--color-accent)" : "#d1d5db"}`,
                    backgroundColor: p === page ? "rgba(245,166,35,0.15)" : "transparent",
                    color: p === page ? "var(--color-accent)" : "#6b7280",
                    fontWeight: p === page ? 600 : 400,
                    fontSize: "0.875rem",
                    textDecoration: "none",
                  }}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subscription popup — appears after 10s for non-subscribers */}
      {!isSubscribed && <SubscriptionPopup locale={locale} />}
    </div>
  );
}
