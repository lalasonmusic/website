import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { artistService } from "@/lib/services/artistService";
import { buildMetadata } from "@/lib/seo";

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
    image: artist.photoUrl ?? undefined,
  });
}

export default async function ArtistePage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations("artists");

  const artist = await artistService.getBySlug(slug);
  if (!artist) notFound();

  const artistTracks = await artistService.getPublishedTracks(artist.id);
  const bio = locale === "fr" ? artist.bioFr : artist.bioEn;

  function formatDuration(seconds: number | null) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
          marginBottom: "3rem",
          flexWrap: "wrap",
        }}
      >
        {artist.photoUrl ? (
          <img
            src={artist.photoUrl}
            alt={artist.name}
            style={{
              width: "160px",
              height: "160px",
              objectFit: "cover",
              borderRadius: "var(--radius-lg)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "160px",
              height: "160px",
              backgroundColor: "var(--color-bg-secondary)",
              borderRadius: "var(--radius-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "3.5rem",
              flexShrink: 0,
            }}
          >
            🎵
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", marginBottom: "1rem" }}>
            {artist.name}
          </h1>
          {bio && (
            <p
              style={{
                color: "var(--color-text-secondary)",
                fontSize: "1rem",
                lineHeight: 1.7,
                maxWidth: "560px",
              }}
            >
              {bio}
            </p>
          )}
        </div>
      </div>

      {/* Track list */}
      <div>
        <h2 style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1.5rem" }}>
          {t("tracks")} ({artistTracks.length})
        </h2>

        {artistTracks.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("noTracks")}</p>
        ) : (
          <div
            style={{
              backgroundColor: "var(--color-bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              overflow: "hidden",
            }}
          >
            {artistTracks.map((track, i) => (
              <div
                key={track.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.875rem 1.25rem",
                  borderBottom:
                    i < artistTracks.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      width: "1.5rem",
                      textAlign: "right",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: "0.9375rem" }}>{track.title}</span>
                  {track.bpm && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        backgroundColor: "var(--color-bg-secondary)",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {track.bpm} BPM
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                  {formatDuration(track.durationSeconds)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <a
            href={`/${locale}/catalogue`}
            style={{
              display: "inline-block",
              padding: "0.875rem 2rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
            }}
          >
            {t("exploreCatalogue")}
          </a>
        </div>
      </div>
    </div>
  );
}
