import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildMetadata, BASE_URL } from "@/lib/seo";
import { trackService } from "@/lib/services/trackService";
import { artistService } from "@/lib/services/artistService";
import HomeTrackList from "@/components/catalogue/HomeTrackList";
import FloatingPlayer from "@/components/player/FloatingPlayer";
import { AudioLines, FileCheck2, Headphones } from "lucide-react";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";
import { blogService } from "@/lib/services/blogService";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return buildMetadata({
    title: locale === "fr" ? "Musique originale, libre de droit" : "Original music, royalty-free",
    description: t("hero_subtitle"),
    locale,
    pagePath: "/",
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("home");

  async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T | null> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err) {
        console.error(`[homepage] DB attempt ${i + 1}/${retries + 1} failed:`, err);
        if (i < retries) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
    return null;
  }

  let popularTracks: Awaited<ReturnType<typeof trackService.getPublished>>["tracks"] = [];
  let allCategories: Awaited<ReturnType<typeof trackService.getAllCategories>> = [];
  let allArtists: Awaited<ReturnType<typeof artistService.getAll>> = [];

  const [tracksResult, cats, artists, blogResult] = await Promise.all([
    withRetry(() => trackService.getPublished({ page: 1, limit: 8 })),
    withRetry(() => trackService.getAllCategories()),
    withRetry(() => artistService.getAll()),
    withRetry(() => blogService.getAll({ page: 1, locale })),
  ]);

  if (tracksResult) popularTracks = tracksResult.tracks;
  if (cats) allCategories = cats;
  if (artists) allArtists = artists;
  const latestPosts = blogResult?.posts.slice(0, 3) ?? [];

  const testimonials = [
    { name: t("testimonial1_name"), role: t("testimonial1_role"), text: t("testimonial1_text") },
    { name: t("testimonial2_name"), role: t("testimonial2_role"), text: t("testimonial2_text") },
    { name: t("testimonial3_name"), role: t("testimonial3_role"), text: t("testimonial3_text") },
    { name: t("testimonial4_name"), role: t("testimonial4_role"), text: t("testimonial4_text") },
  ];

  return (
    <div>
      {/* Floating player widget — auto-plays a random track */}
      {popularTracks.length > 0 && <FloatingPlayer tracks={popularTracks} locale={locale} />}

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          minHeight: "calc(100vh - 60px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          backgroundImage: "url(/hero-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      >
        {/* Dark overlay for text readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", paddingLeft: "clamp(1rem, 5vw, 4rem)" }}>
          <h1
            style={{
              fontFamily: "var(--font-poppins)",
              fontWeight: 800,
              fontSize: "clamp(2.25rem, 5vw, 3.5rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
              color: "white",
            }}
          >
            {t("hero_title")}{" "}
            <span style={{ color: "var(--color-accent)" }}>{t("hero_title_accent")}</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(255,255,255,0.8)",
              maxWidth: "500px",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            {t("hero_subtitle")}
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href={`/${locale}/catalogue`}
            style={{
              padding: "0.875rem 2rem",
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-text)",
              fontWeight: 600,
              fontSize: "1rem",
              borderRadius: "var(--radius-full)",
              textDecoration: "none",
            }}
          >
            {t("hero_cta_primary")}
          </a>
          <a
            href={`/${locale}/abonnements`}
            style={{
              padding: "0.875rem 2rem",
              backgroundColor: "transparent",
              color: "white",
              fontWeight: 500,
              fontSize: "1rem",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}
          >
            {t("hero_cta_secondary")}
          </a>
          </div>
        </div>
      </section>

      {/* ── POPULAR TRACKS ── */}
      {popularTracks.length > 0 && (
        <section style={{ padding: "5rem 1.5rem", background: "linear-gradient(to bottom, #e8edf0 0%, #f8f7f5 80px, #f8f7f5 100%)" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                textAlign: "center",
                marginBottom: "2.5rem",
                color: "#1b3a4b",
              }}
            >
              {t("popular_title")}
            </h2>

            <HomeTrackList tracks={popularTracks} locale={locale} />
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section
        style={{
          padding: "4.5rem 1.5rem",
          background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 50%, #0f2533 100%)",
        }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              textAlign: "center",
              marginBottom: "3rem",
              color: "white",
            }}
          >
            {locale === "fr" ? "Pourquoi " : "Why "}
            <span style={{ color: "var(--color-accent)" }}>Lalason</span>
            {" ?"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0",
            }}
          >
            {[
              { title: t("feature1_title"), desc: t("feature1_desc"), anim: "feature-icon-sway", icon: (
                <AudioLines size={26} strokeWidth={1.5} color="var(--color-accent)" />
              )},
              { title: t("feature2_title"), desc: t("feature2_desc"), anim: "feature-icon-float", icon: (
                <FileCheck2 size={26} strokeWidth={1.5} color="var(--color-accent)" />
              )},
              { title: t("feature3_title"), desc: t("feature3_desc"), anim: "feature-icon-pulse", icon: (
                <Headphones size={26} strokeWidth={1.5} color="var(--color-accent)" />
              )},
            ].map((f, i) => (
              <div
                key={f.title}
                style={{
                  padding: "1.5rem 2rem",
                  textAlign: "center",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div style={{
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "center",
                }}>
                  <div
                    className={f.anim}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "rgba(245, 166, 35, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {f.icon}
                  </div>
                </div>
                <h3 style={{
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.5rem",
                  color: "white",
                }}>
                  {f.title}
                </h3>
                <p style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "5rem 1.5rem", backgroundColor: "#f8f7f5" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              textAlign: "center",
              marginBottom: "2.5rem",
              color: "#1b3a4b",
            }}
          >
            {t("testimonials_title")}
          </h2>

          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* ── QUI SOMMES-NOUS ── */}
      <section style={{
        padding: "5rem 1.5rem",
        background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
      }}>
        <div style={{
          maxWidth: "960px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "3rem",
          flexWrap: "wrap",
        }}>
          {/* Video */}
          <div style={{
            flex: "1 1 400px",
            aspectRatio: "16/9",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}>
            <iframe
              src="https://www.youtube-nocookie.com/embed/PShwEajxAxk"
              title="Lalason - Qui sommes-nous ?"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: "1 1 300px" }}>
            <h2 style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              color: "white",
              marginBottom: "1rem",
            }}>
              {t("about_title")}
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.9375rem",
              lineHeight: 1.8,
              margin: 0,
            }}>
              {t("about_text")}
            </p>
          </div>
        </div>
      </section>

      {/* ── YOUTUBE CHANNEL ── */}
      <section style={{ padding: "5rem 1.5rem", backgroundColor: "#f8f7f5" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            fontWeight: 800,
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            color: "#1b3a4b",
            marginBottom: "0.75rem",
          }}>
            {locale === "fr"
              ? "Retrouvez nos musiques libres de droit originales sur YouTube"
              : "Find our original royalty-free music on YouTube"}
          </h2>
          <p style={{
            color: "#6b7280",
            fontSize: "0.9375rem",
            marginBottom: "2.5rem",
            maxWidth: "560px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            {locale === "fr"
              ? "La Musique Libre est une chaîne YouTube regroupant pour vous les meilleures musiques libres de droits."
              : "La Musique Libre is a YouTube channel bringing you the best royalty-free music."}
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}>
            {["r8h8a3omWKA", "zrXbhncmorc", "A-8XzXakxio"].map((id) => (
              <div key={id} style={{
                aspectRatio: "16/9",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
              }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}`}
                  title="La Musique Libre"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              </div>
            ))}
          </div>

          <a
            href="https://www.youtube.com/@LaMusiqueLibre"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              backgroundColor: "#FF0000",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9375rem",
              borderRadius: "9999px",
              textDecoration: "none",
            }}
          >
            {locale === "fr" ? "Je rejoins la chaîne" : "Join the channel"} →
          </a>
        </div>
      </section>

      {/* ── LATEST BLOG POSTS ── */}
      {latestPosts.length > 0 && (
        <section style={{
          padding: "5rem 1.5rem",
          background: "linear-gradient(180deg, #0f2533 0%, #1b3a4b 100%)",
        }}>
          <div style={{ maxWidth: "960px", margin: "0 auto" }}>
            <h2 style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
              textAlign: "center",
              marginBottom: "2.5rem",
              color: "white",
            }}>
              {locale === "fr" ? "Nos dernières actus" : "Latest news"}
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
              marginBottom: "2.5rem",
            }}>
              {latestPosts.map((post) => (
                <a
                  key={post.id}
                  href={`/${locale}/blog/${post.slug}`}
                  style={{
                    textDecoration: "none",
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    transition: "border-color 0.2s",
                  }}
                >
                  {post.coverUrl && (
                    <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                      <img
                        src={post.coverUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                  )}
                  <div style={{ padding: "1rem 1.25rem" }}>
                    <p style={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      color: "white",
                      margin: "0 0 0.375rem",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {post.title}
                    </p>
                    {post.metaDescription && (
                      <p style={{
                        fontSize: "0.8125rem",
                        color: "rgba(255,255,255,0.5)",
                        margin: 0,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {post.metaDescription}
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <a
                href={`/${locale}/blog`}
                style={{
                  display: "inline-block",
                  padding: "0.75rem 2rem",
                  color: "var(--color-accent)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderRadius: "9999px",
                  border: "1px solid var(--color-accent)",
                  textDecoration: "none",
                }}
              >
                {locale === "fr" ? "En découvrir plus" : "Discover more"} →
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA FINAL ── */}
      <section
        style={{
          padding: "5rem 1.5rem",
          textAlign: "center",
          background: `radial-gradient(ellipse at 50% 100%, rgba(245,166,35,0.1) 0%, transparent 60%), var(--color-bg-primary)`,
        }}
      >
        <h2
          style={{
            fontWeight: 800,
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            marginBottom: "1rem",
          }}
        >
          {t("cta_title")}
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "1.125rem", marginBottom: "2rem" }}>
          {t("cta_subtitle")}
        </p>
        <a
          href={`/${locale}/abonnements`}
          style={{
            display: "inline-block",
            padding: "0.875rem 2.5rem",
            backgroundColor: "var(--color-accent)",
            color: "var(--color-accent-text)",
            fontWeight: 600,
            fontSize: "1rem",
            borderRadius: "var(--radius-full)",
            textDecoration: "none",
          }}
        >
          {t("cta_button")}
        </a>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Lalason",
            url: BASE_URL,
            description: t("hero_subtitle"),
          }),
        }}
      />
    </div>
  );
}
