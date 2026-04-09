import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import {
  subscriptions,
  trackFavorites,
  tracks,
  artists,
  trackCategories,
  categories as categoriesTable,
} from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import TrackCard from "@/components/catalogue/TrackCard";
import type { TrackWithDetails, TrackCategory } from "@/types/track";

type Props = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PREVIEW_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio-previews`;

function buildPreviewUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${PREVIEW_BASE}/${path}`;
}

export default async function FavoritesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("member");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/connexion`);

  // Verify the user has a Creators subscription
  const [sub] = await db
    .select({ planType: subscriptions.planType })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);

  const isCreator = sub?.planType === "creators_monthly" || sub?.planType === "creators_annual";
  if (!isCreator) {
    redirect(`/${locale}/membre`);
  }

  // Fetch favorite track IDs in order (most recent first)
  const favRows = await db
    .select({ trackId: trackFavorites.trackId, createdAt: trackFavorites.createdAt })
    .from(trackFavorites)
    .where(eq(trackFavorites.userId, user.id))
    .orderBy(desc(trackFavorites.createdAt));

  let favoriteTracks: TrackWithDetails[] = [];

  if (favRows.length > 0) {
    const ids = favRows.map((r) => r.trackId);

    const trackRows = await db
      .select({
        id: tracks.id,
        slug: tracks.slug,
        title: tracks.title,
        artistName: artists.name,
        durationSeconds: tracks.durationSeconds,
        bpm: tracks.bpm,
        coverUrl: tracks.coverUrl,
        previewPath: tracks.filePreviewPath,
        fullPath: tracks.fileFullPath,
        createdAt: tracks.createdAt,
      })
      .from(tracks)
      .innerJoin(artists, eq(artists.id, tracks.artistId))
      .where(and(inArray(tracks.id, ids), eq(tracks.isPublished, true)));

    // Fetch categories for these tracks
    const catRows = await db
      .select({
        trackId: trackCategories.trackId,
        slug: categoriesTable.slug,
        labelFr: categoriesTable.labelFr,
        labelEn: categoriesTable.labelEn,
        type: categoriesTable.type,
      })
      .from(trackCategories)
      .innerJoin(categoriesTable, eq(categoriesTable.id, trackCategories.categoryId))
      .where(inArray(trackCategories.trackId, ids));

    const byTrackId = catRows.reduce<Record<string, TrackCategory[]>>((acc, row) => {
      if (!acc[row.trackId]) acc[row.trackId] = [];
      acc[row.trackId].push({ slug: row.slug, labelFr: row.labelFr, labelEn: row.labelEn, type: row.type });
      return acc;
    }, {});

    const trackMap = new Map(
      trackRows.map((r) => [
        r.id,
        {
          ...r,
          previewPath: buildPreviewUrl(r.previewPath),
          createdAt: r.createdAt ? r.createdAt.toISOString() : null,
          categories: byTrackId[r.id] ?? [],
        } as TrackWithDetails,
      ])
    );

    // Preserve favorites order (most recent first)
    favoriteTracks = ids
      .map((id) => trackMap.get(id))
      .filter((t): t is TrackWithDetails => Boolean(t));
  }

  return (
    <div>
      {/* Header */}
      <section
        style={{
          padding: "3rem 1.5rem 2rem",
          background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <Link
            href={`/${locale}/membre`}
            style={{
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginBottom: "1rem",
            }}
          >
            ← {t("backToAccount")}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #f5a623 0%, #e8961a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: "1.75rem", color: "white", margin: "0 0 0.25rem" }}>
                {t("favoritesTitle")}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", margin: 0 }}>
                {favoriteTracks.length}{" "}
                {favoriteTracks.length === 1 ? t("favoriteTrackSingular") : t("favoriteTrackPlural")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <div
        style={{
          background: "linear-gradient(to bottom, #e8edf0 0%, #f8f7f5 80px, #f8f7f5 100%)",
          padding: "2.5rem 1.5rem 4rem",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {favoriteTracks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p style={{ color: "#6b7280", fontSize: "1rem", marginBottom: "1rem" }}>
                {t("favoritesEmpty")}
              </p>
              <Link
                href={`/${locale}/catalogue`}
                style={{
                  display: "inline-block",
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-text)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderRadius: 9999,
                  textDecoration: "none",
                }}
              >
                {t("favoritesBrowseCatalogue")}
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {favoriteTracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={favoriteTracks}
                  queueIndex={index}
                  locale={locale}
                  isSubscribed={true}
                  canDownload={true}
                  canFavorite={true}
                  isFavorite={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
