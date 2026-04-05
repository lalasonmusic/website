import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildMetadata, BASE_URL } from "@/lib/seo";
import { trackService } from "@/lib/services/trackService";
import { artistService } from "@/lib/services/artistService";
import HomeTrackList from "@/components/catalogue/HomeTrackList";
import FloatingPlayer from "@/components/player/FloatingPlayer";

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

  const [tracksResult, cats, artists] = await Promise.all([
    withRetry(() => trackService.getPublished({ page: 1, limit: 8 })),
    withRetry(() => trackService.getAllCategories()),
    withRetry(() => artistService.getAll()),
  ]);

  if (tracksResult) popularTracks = tracksResult.tracks;
  if (cats) allCategories = cats;
  if (artists) allArtists = artists;

  const styles = allCategories.filter((c) => c.type === "STYLE");
  const themes = allCategories.filter((c) => c.type === "THEME");
  const moods = allCategories.filter((c) => c.type === "MOOD");
  const featuredArtists = allArtists.slice(0, 7);

  const testimonials = [
    { name: t("testimonial1_name"), role: t("testimonial1_role"), text: t("testimonial1_text") },
    { name: t("testimonial2_name"), role: t("testimonial2_role"), text: t("testimonial2_text") },
    { name: t("testimonial3_name"), role: t("testimonial3_role"), text: t("testimonial3_text") },
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
          backgroundColor: "#1b3a4b",
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
            {t("features_title").replace("Lalason", "").trim()}{" "}
            <span style={{ color: "var(--color-accent)" }}>Lalason</span>
            {t("features_title").includes("?") ? " ?" : ""}
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
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
              )},
              { title: t("feature2_title"), desc: t("feature2_desc"), anim: "feature-icon-float", icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              )},
              { title: t("feature3_title"), desc: t("feature3_desc"), anim: "feature-icon-pulse", icon: (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              )},
            ].map((f, i) => (
              <div
                key={f.title}
                style={{
                  padding: "1.5rem 2rem",
                  textAlign: "center",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
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
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "rgba(245, 166, 35, 0.1)",
                      border: "1px solid rgba(245, 166, 35, 0.2)",
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
      <section style={{ padding: "5rem 1.5rem", backgroundColor: "var(--color-bg-secondary)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              textAlign: "center",
              marginBottom: "3rem",
            }}
          >
            {t("testimonials_title")}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {testimonials.map((item) => (
              <div
                key={item.name}
                style={{
                  padding: "2rem",
                  backgroundColor: "var(--color-bg-card)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9375rem",
                    lineHeight: 1.7,
                    color: "var(--color-text-secondary)",
                    marginBottom: "1.25rem",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{item.text}&rdquo;
                </p>
                <p style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.125rem" }}>
                  {item.name}
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                  {item.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARTISTS ── */}
      {featuredArtists.length > 0 && (
        <section style={{ padding: "5rem 1.5rem", backgroundColor: "var(--color-bg-primary)" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                textAlign: "center",
                marginBottom: "0.75rem",
              }}
            >
              {t("artists_title")}
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--color-text-secondary)",
                fontSize: "1rem",
                marginBottom: "3rem",
                maxWidth: "520px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {t("artists_subtitle")}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                gap: "1.5rem",
                justifyItems: "center",
              }}
            >
              {featuredArtists.map((artist) => (
                <a
                  key={artist.id}
                  href={`/${locale}/nos-artistes/${artist.slug}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textDecoration: "none",
                    gap: "0.625rem",
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      overflow: "hidden",
                      backgroundColor: "var(--color-bg-card)",
                      border: "2px solid var(--color-border)",
                    }}
                  >
                    {artist.photoUrl ? (
                      <img
                        src={artist.photoUrl}
                        alt={artist.name}
                        width={96}
                        height={96}
                        style={{ objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          fontSize: "2rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        🎤
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      color: "var(--color-text-primary)",
                      textAlign: "center",
                    }}
                  >
                    {artist.name}
                  </span>
                </a>
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
              <a
                href={`/${locale}/nos-artistes`}
                style={{
                  padding: "0.75rem 2rem",
                  backgroundColor: "transparent",
                  color: "var(--color-accent)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--color-accent)",
                  textDecoration: "none",
                }}
              >
                {t("artists_cta")} →
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
