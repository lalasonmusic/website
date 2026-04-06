import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { artistService } from "@/lib/services/artistService";
import { buildMetadata } from "@/lib/seo";
import { getArtistPhoto } from "@/lib/artistPhotos";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import TrackCard from "@/components/catalogue/TrackCard";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const revalidate = 86400;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const artist = await artistService.getBySlug(slug);
  if (!artist) return {};
  const bio = locale === "fr" ? artist.bioFr : artist.bioEn;
  return buildMetadata({
    title: artist.name,
    description: bio ?? artist.name,
    locale,
    pagePath: `/nos-artistes/${slug}`,
    image: getArtistPhoto(slug, artist.photoUrl) ?? undefined,
  });
}

export default async function ArtistePage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations("artists");

  const artist = await artistService.getBySlug(slug);
  if (!artist) notFound();

  const artistTracks = await artistService.getPublishedTracks(artist.id);
  const bio = locale === "fr" ? artist.bioFr : artist.bioEn;
  const photoUrl = getArtistPhoto(slug, artist.photoUrl);

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

  return (
    <div>
      {/* Hero — artist photo + name */}
      <section style={{
        padding: "4rem 1.5rem 3rem",
        background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {/* Photo */}
          <div style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            overflow: "hidden",
            margin: "0 auto 1.25rem",
            border: "3px solid rgba(245, 166, 35, 0.4)",
          }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={artist.name}
                width={120}
                height={120}
                style={{ objectFit: "cover", display: "block", width: "100%", height: "100%" }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ fontSize: "2.5rem", color: "rgba(255,255,255,0.3)" }}>♪</span>
              </div>
            )}
          </div>

          {/* Name */}
          <h1 style={{
            fontWeight: 800,
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            color: "white",
            margin: "0 0 0.5rem",
          }}>
            {artist.name}
          </h1>

          {/* Bio */}
          {bio && (
            <p style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.9375rem",
              lineHeight: 1.7,
              maxWidth: "520px",
              margin: "0 auto",
            }}>
              {bio}
            </p>
          )}

          {/* Track count */}
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.8125rem",
            marginTop: "1rem",
          }}>
            {artistTracks.length} {artistTracks.length > 1
              ? (locale === "fr" ? "morceaux" : "tracks")
              : (locale === "fr" ? "morceau" : "track")}
          </p>
        </div>
      </section>

      {/* Track list — same style as catalogue */}
      <div style={{
        background: "linear-gradient(to bottom, #e8edf0 0%, #f8f7f5 80px, #f8f7f5 100%)",
        color: "#1b3a4b",
        padding: "2rem 1.5rem 2.5rem",
      }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {artistTracks.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "3rem 0" }}>
              {t("noTracks")}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {artistTracks.map((track, index) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  queue={artistTracks}
                  queueIndex={index}
                  locale={locale}
                  isSubscribed={isSubscribed}
                />
              ))}
            </div>
          )}

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <a
              href={`/${locale}/catalogue`}
              style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-accent-text)",
                fontWeight: 600,
                fontSize: "0.9375rem",
                borderRadius: "9999px",
                textDecoration: "none",
              }}
            >
              {t("exploreCatalogue")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
