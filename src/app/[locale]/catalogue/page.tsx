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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isSubscribed = false;
  if (user) {
    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
      .limit(1);
    isSubscribed = !!sub;
  }

  // Fetch tracks + categories
  const [{ tracks, total }, allCategories] = await Promise.all([
    trackService.getPublished({
      page,
      limit: TRACKS_PER_PAGE,
      search: q,
      style,
      theme,
      mood,
    }),
    trackService.getAllCategories(),
  ]);

  const totalPages = Math.ceil(total / TRACKS_PER_PAGE);

  const filterCategories: TrackCategory[] = allCategories.map((c) => ({
    slug: c.slug,
    labelFr: c.labelFr,
    labelEn: c.labelEn,
    type: c.type as "STYLE" | "THEME" | "MOOD",
  }));

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      {/* CTA Banner */}
      {!isSubscribed && (
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a
            href={`/${locale}/abonnements`}
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
            }}
          >
            {locale === "fr" ? "Toute la musique en illimité ? Clique ici !" : "Unlimited music? Click here!"}
          </a>
        </div>
      )}

      <h1 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: "1.75rem" }}>
        {t("title")}
      </h1>

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
        />
      </Suspense>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>{t("noResults")}</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
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
                border: `1px solid ${p === page ? "var(--color-accent)" : "var(--color-border)"}`,
                backgroundColor: p === page ? "rgba(245,166,35,0.15)" : "transparent",
                color: p === page ? "var(--color-accent)" : "var(--color-text-secondary)",
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
  );
}
