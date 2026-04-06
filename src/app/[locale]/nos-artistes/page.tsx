import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { artistService } from "@/lib/services/artistService";
import { buildMetadata } from "@/lib/seo";
import { getArtistPhoto } from "@/lib/artistPhotos";

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
    <div>
      {/* Hero */}
      <section style={{
        padding: "4rem 1.5rem 3rem",
        background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
        textAlign: "center",
      }}>
        <h1 style={{
          fontWeight: 800,
          fontSize: "clamp(2rem, 4vw, 2.75rem)",
          color: "white",
          marginBottom: "0.75rem",
        }}>
          {t("pageTitle")}
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: "1rem",
          maxWidth: "520px",
          margin: "0 auto",
          lineHeight: 1.6,
        }}>
          {t("pageDescription")}
        </p>
      </section>

      {/* Artists grid */}
      <section style={{
        padding: "3rem 1.5rem 4rem",
        background: "linear-gradient(180deg, #1b3a4b 0%, #0f2533 100%)",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {allArtists.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>{t("noArtists")}</p>
          ) : (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "2rem",
            }}>
              {allArtists.map((artist) => (
                <a
                  key={artist.id}
                  href={`/${locale}/nos-artistes/${artist.slug}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    textAlign: "center",
                    width: 150,
                  }}
                >
                  {/* Photo circle */}
                  <div style={{
                    width: 140,
                    height: 140,
                    borderRadius: "50%",
                    overflow: "hidden",
                    margin: "0 auto 0.75rem",
                    border: "3px solid rgba(245, 166, 35, 0.3)",
                    transition: "border-color 0.2s, transform 0.2s",
                  }}>
                    {getArtistPhoto(artist.slug, artist.photoUrl) ? (
                      <img
                        src={getArtistPhoto(artist.slug, artist.photoUrl)!}
                        alt={artist.name}
                        width={140}
                        height={140}
                        style={{ objectFit: "cover", display: "block", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: "linear-gradient(135deg, #1b3a4b 0%, #2d5f7a 50%, #1b3a4b 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <span style={{
                          fontSize: "2.5rem",
                          color: "rgba(255,255,255,0.2)",
                        }}>♪</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p style={{
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    color: "white",
                    margin: 0,
                  }}>
                    {artist.name}
                  </p>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
