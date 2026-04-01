import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { trackService } from "@/lib/services/trackService";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Suspense } from "react";
import CatalogueFilters from "@/components/catalogue/CatalogueFilters";
import TrackCard from "@/components/catalogue/TrackCard";
import type { TrackCategory } from "@/types/track";
import { buildMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; style?: string; theme?: string; mood?: string; page?: string }>;
};

const TRACKS_PER_PAGE = 20;

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Catalogue" : "Catalogue",
    description:
      locale === "fr"
        ? "Écoutez et téléchargez 300+ morceaux originaux, libres de droit pour vos vidéos, podcasts et projets créatifs."
        : "Listen to and download 300+ original royalty-free tracks for your videos, podcasts and creative projects.",
    locale,
    pagePath: "/catalogue",
  });
}

export default async function CataloguePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q, style, theme, mood, page: pageStr } = await searchParams;
  const t = await getTranslations("catalogue");

  const page = parseInt(pageStr ?? "1", 10);

  // Check subscription
  let isSubscribed = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const [sub] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
        .limit(1);
      isSubscribed = !!sub;
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

  const totalPages = isFallback ? 0 : Math.ceil(total / TRACKS_PER_PAGE);

  const filterCategories: TrackCategory[] = allCategories.map((c) => ({
    slug: c.slug,
    labelFr: c.labelFr,
    labelEn: c.labelEn,
    type: c.type as "STYLE" | "THEME" | "MOOD",
  }));

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
            backgroundColor: "rgba(27, 58, 75, 0.82)",
          }}
        />
        <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
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
                {locale === "fr" ? "Accès illimité dès 99\u00A0€/an" : "Unlimited access from €99/year"}
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
    </div>
  );
}
