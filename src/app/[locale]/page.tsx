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

  let popularTracks: Awaited<ReturnType<typeof trackService.getPublished>>["tracks"] = [];
  let allCategories: Awaited<ReturnType<typeof trackService.getAllCategories>> = [];
  let allArtists: Awaited<ReturnType<typeof artistService.getAll>> = [];

  try {
    const [tracksResult, cats, artists] = await Promise.all([
      trackService.getPublished({ page: 1, limit: 8 }),
      trackService.getAllCategories(),
      artistService.getAll(),
    ]);
    popularTracks = tracksResult.tracks;
    allCategories = cats;
    allArtists = artists;
  } catch {
    // DB tables may not exist yet or be empty — show page without dynamic sections
  }

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

      {/* ── CATEGORIES ── */}
      {allCategories.length > 0 && (
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
              {t("categories_title")}
            </h2>

            {[
              { label: t("categories_style"), param: "style", items: styles },
              { label: t("categories_theme"), param: "theme", items: themes },
              { label: t("categories_mood"), param: "mood", items: moods },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <div key={group.param} style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {group.label}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {group.items.map((cat) => (
                      <a
                        key={cat.id}
                        href={`/${locale}/catalogue?${group.param}=${cat.slug}`}
                        style={{
                          padding: "0.5rem 1.25rem",
                          backgroundColor: "var(--color-bg-card)",
                          borderRadius: "var(--radius-full)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-primary)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          textDecoration: "none",
                          transition: "border-color 0.15s",
                        }}
                      >
                        {locale === "en" ? cat.labelEn : cat.labelFr}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section
        style={{
          padding: "5rem 1.5rem",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              textAlign: "center",
              marginBottom: "3rem",
            }}
          >
            {t("features_title")}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2rem",
            }}
          >
            {[
              { title: t("feature1_title"), desc: t("feature1_desc"), icon: "🎵" },
              { title: t("feature2_title"), desc: t("feature2_desc"), icon: "📄" },
              { title: t("feature3_title"), desc: t("feature3_desc"), icon: "🚀" },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  padding: "2rem",
                  backgroundColor: "var(--color-bg-card)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                  {f.title}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
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
