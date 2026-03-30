import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { artistService } from "@/lib/services/artistService";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "artists" });
  return buildMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
    locale,
    pagePath: "/nos-artistes",
  });
}

export default async function NosArtistesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("artists");
  const allArtists = await artistService.getAll();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: "0.75rem" }}>
        {t("pageTitle")}
      </h1>
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "1.0625rem",
          marginBottom: "3rem",
          maxWidth: "560px",
        }}
      >
        {t("pageDescription")}
      </p>

      {allArtists.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)" }}>{t("noArtists")}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "2rem",
          }}
        >
          {allArtists.map((artist) => (
            <a
              key={artist.id}
              href={`/${locale}/nos-artistes/${artist.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  backgroundColor: "var(--color-bg-card)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {artist.photoUrl ? (
                  <img
                    src={artist.photoUrl}
                    alt={artist.name}
                    style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      backgroundColor: "var(--color-bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "3rem",
                    }}
                  >
                    🎵
                  </div>
                )}
                <div style={{ padding: "1rem" }}>
                  <p style={{ fontWeight: 700, fontSize: "1rem" }}>{artist.name}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
