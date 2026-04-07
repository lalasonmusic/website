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
import FaqAccordion from "@/components/home/FaqAccordion";
import NewsletterForm from "@/components/layout/NewsletterForm";

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

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "320px" }}>
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
                textAlign: "center",
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
                textAlign: "center",
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
              gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
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
              gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
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

      {/* ── FAQ ── */}
      <section style={{ padding: "5rem 1.5rem", backgroundColor: "#f8f7f5" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <h2 style={{
            fontWeight: 800,
            fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
            textAlign: "center",
            marginBottom: "0.5rem",
            color: "#1b3a4b",
          }}>
            FAQ
          </h2>
          <p style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: "0.9375rem",
            marginBottom: "2.5rem",
          }}>
            {locale === "fr" ? "sur les musiques libres de droit" : "about royalty-free music"}
          </p>

          <FaqAccordion items={locale === "fr" ? [
            {
              question: "Comment se passe la licence de l'abonnement ?",
              answer: "Nos abonnements vous permettent d'accéder à l'ensemble de notre bibliothèque de musique avec des téléchargements illimités. Pour chaque titre que vous téléchargez pendant la durée de votre abonnement, vous pouvez obtenir un certificat de licence qui vous autorise à utiliser le titre pour vous-même et vos clients.",
            },
            {
              question: "Comment puis-je m'assurer que ma chaîne YouTube est en liste blanche pour éviter les revendications de droits d'auteur ?",
              answer: "YouTube utilise un logiciel de reconnaissance pour détecter si de la musique protégée par des droits d'auteur est utilisée dans votre vidéo. Afin d'éviter des revendications de contenu, vous devez ajouter votre identifiant de chaîne YouTube à votre espace membre. Lalason est alors en mesure de reconnaître votre chaîne et de s'assurer que toutes les revendications liées à la musique Lalason sont automatiquement traitées.",
            },
            {
              question: "Puis-je utiliser votre musique pour Facebook/Instagram/YouTube/etc. ?",
              answer: "Oui, vous pouvez utiliser notre musique dans vos vidéos sur les réseaux sociaux. Cependant, vous ne pouvez pas enregistrer ces vidéos auprès du service Facebook/Instagram Rights Manager ou de tout autre service similaire de médias sociaux.",
            },
            {
              question: "Puis-je monétiser ma vidéo avec la musique de Lalason ? Combien de temps ?",
              answer: "Oui, vous pouvez monétiser vos vidéos. Si vous vous abonnez, tous les projets que vous créez et publiez sur les réseaux sont couverts tant que votre abonnement est actif.",
            },
          ] : [
            {
              question: "How does the subscription license work?",
              answer: "Our subscriptions give you access to our entire music library with unlimited downloads. For each track you download during your subscription, you can obtain a license certificate that authorizes you to use the track for yourself and your clients.",
            },
            {
              question: "How can I make sure my YouTube channel is whitelisted to avoid copyright claims?",
              answer: "YouTube uses recognition software to detect if copyrighted music is used in your video. To avoid content claims, you need to add your YouTube channel ID to your member area. Lalason can then recognize your channel and ensure that all claims related to Lalason music are automatically handled.",
            },
            {
              question: "Can I use your music for Facebook/Instagram/YouTube/etc.?",
              answer: "Yes, you can use our music in your social media videos. However, you cannot register these videos with the Facebook/Instagram Rights Manager service or any similar social media service.",
            },
            {
              question: "Can I monetize my video with Lalason music? For how long?",
              answer: "Yes, you can monetize your videos. If you subscribe, all the projects you create and publish on social media are covered as long as your subscription is active.",
            },
          ]} />
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section style={{
        position: "relative",
        padding: "5rem 1.5rem",
        overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        >
          <source src="/newsletter-bg.mp4" type="video/mp4" />
        </video>
        {/* Warm overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(140, 90, 20, 0.7)",
          zIndex: 1,
        }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "600px", margin: "0 auto" }}>
          <p style={{
            fontWeight: 700,
            fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
            color: "white",
            lineHeight: 1.5,
            marginBottom: "2rem",
          }}>
            {locale === "fr"
              ? "Recevez toutes nos dernières actualités une fois par mois en vous inscrivant ici !"
              : "Get all our latest news once a month by signing up here!"}
          </p>
          <div style={{
            maxWidth: "480px",
            margin: "0 auto",
            backgroundColor: "white",
            borderRadius: "9999px",
            padding: "0.375rem",
            display: "flex",
          }}>
            <NewsletterForm
              placeholder={locale === "fr" ? "Ex. nom@exemple.fr" : "Ex. name@example.com"}
              buttonLabel={locale === "fr" ? "S'abonner" : "Subscribe"}
              successMessage={locale === "fr" ? "Merci pour votre inscription !" : "Thanks for subscribing!"}
            />
          </div>
        </div>
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
