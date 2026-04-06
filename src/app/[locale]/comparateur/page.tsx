import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    title: locale === "fr" ? "Comparateur" : "Comparison",
    description: locale === "fr"
      ? "Comparaison entre Lalason, Bensound, Epidemic Sound et Artlist.io"
      : "Comparison between Lalason, Bensound, Epidemic Sound and Artlist.io",
    locale,
    pagePath: "/comparateur",
  });
}

const platforms = [
  {
    name: "Lalason",
    subtitleFr: "L'Éloge de la Musique Libre de Droit Francophone",
    subtitleEn: "The Premier Francophone Royalty-Free Music Platform",
    descFr: "Lalason se différencie par son engagement à promouvoir les artistes francophones. Avec un modèle d'abonnement simple et abordable, Lalason offre une bibliothèque exclusive de musiques libres de droits produites par des talents locaux. De plus, leur support client disponible 24/24 et 7/7 assure une expérience utilisateur fluide et un accompagnement personnalisé.",
    descEn: "Lalason stands out through its commitment to promoting francophone artists. With a simple and affordable subscription model, Lalason offers an exclusive library of royalty-free music produced by local talent. Plus, their 24/7 customer support ensures a smooth user experience and personalized guidance.",
    ctaFr: "Accéder à la librairie",
    ctaEn: "Browse the library",
    href: "catalogue",
    accent: true,
  },
  {
    name: "Bensound",
    subtitleFr: "Diversité à l'Échelle Internationale",
    subtitleEn: "Diversity on a Global Scale",
    descFr: "Bensound propose une variété impressionnante de pistes musicales libres de droits provenant d'artistes du monde entier. Avec plusieurs options tarifaires, Bensound offre de la flexibilité aux créateurs de tous horizons. L'expérience utilisateur est aussi bien travaillée.",
    descEn: "Bensound offers an impressive variety of royalty-free music tracks from artists around the world. With multiple pricing options, Bensound provides flexibility for creators of all backgrounds. The user experience is also well-crafted.",
    ctaFr: "Découvrir",
    ctaEn: "Discover",
    href: null,
    accent: false,
  },
  {
    name: "Epidemic Sound",
    subtitleFr: "Excellence Sonore et Choix Étendu de Musiques Libres de Droit",
    subtitleEn: "Sound Excellence and Extensive Royalty-Free Music Selection",
    descFr: "Epidemic Sound est une entreprise basée en Suède. Elle se distingue par sa qualité sonore inégalée et son choix étendu de musiques libres de droit. Ce sont les pionniers en matière de musique libre de droit. Leur modèle d'abonnement offre des options pour différents types de projets, allant des projets personnels aux productions commerciales.",
    descEn: "Epidemic Sound is a Swedish company that stands out for its unmatched sound quality and extensive selection of royalty-free music. They are pioneers in royalty-free music. Their subscription model offers options for different project types, from personal projects to commercial productions.",
    ctaFr: "Découvrir",
    ctaEn: "Discover",
    href: null,
    accent: false,
  },
  {
    name: "Artlist.io",
    subtitleFr: "Exploration Musicale à Portée de Main",
    subtitleEn: "Musical Exploration at Your Fingertips",
    descFr: "Artlist.io propose une expérience musicale immersive, adaptée à une multitude de projets vidéos créatifs. Avec des niveaux d'abonnement variés, Artlist.io s'adresse tant aux créateurs indépendants qu'aux professionnels. En plus d'offrir des musiques libres de droits, ils offrent également un service d'images libres de droit.",
    descEn: "Artlist.io offers an immersive musical experience, suited to a wide range of creative video projects. With various subscription levels, Artlist.io caters to both independent creators and professionals. In addition to royalty-free music, they also offer a stock footage service.",
    ctaFr: "Découvrir",
    ctaEn: "Discover",
    href: null,
    accent: false,
  },
];

export default async function ComparateurPage({ params }: Props) {
  const { locale } = await params;
  const isFr = locale === "fr";

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
          fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          color: "white",
          maxWidth: "700px",
          margin: "0 auto 1rem",
          lineHeight: 1.3,
        }}>
          {isFr
            ? "Trouvez la Plateforme Musicale Libre de Droit Parfaite"
            : "Find the Perfect Royalty-Free Music Platform"}
        </h1>
        <p style={{
          color: "rgba(255,255,255,0.6)",
          fontSize: "1rem",
          maxWidth: "500px",
          margin: "0 auto",
        }}>
          {isFr
            ? "Comparaison entre Lalason, Bensound, Epidemic Sound et Artlist.io"
            : "Comparison between Lalason, Bensound, Epidemic Sound and Artlist.io"}
        </p>
      </section>

      {/* Platforms */}
      <section style={{
        padding: "3rem 1.5rem 4rem",
        backgroundColor: "#f8f7f5",
      }}>
        <div style={{
          maxWidth: "900px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}>
          {platforms.map((p) => (
            <div
              key={p.name}
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: "2rem",
                border: p.accent ? "2px solid var(--color-accent)" : "1px solid #e5e7eb",
                position: "relative",
              }}
            >
              {p.accent && (
                <span style={{
                  position: "absolute",
                  top: -12,
                  left: 24,
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-accent-text)",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.75rem",
                  borderRadius: 6,
                  textTransform: "uppercase",
                }}>
                  {isFr ? "Notre plateforme" : "Our platform"}
                </span>
              )}
              <h2 style={{
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "#1b3a4b",
                marginBottom: "0.25rem",
              }}>
                {p.name}
              </h2>
              <p style={{
                fontSize: "0.875rem",
                color: "var(--color-accent)",
                fontWeight: 600,
                marginBottom: "1rem",
              }}>
                {isFr ? p.subtitleFr : p.subtitleEn}
              </p>
              <p style={{
                fontSize: "0.9375rem",
                color: "#4b5563",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}>
                {isFr ? p.descFr : p.descEn}
              </p>
              {p.href && (
                <a
                  href={`/${locale}/${p.href}`}
                  style={{
                    display: "inline-block",
                    padding: "0.625rem 1.5rem",
                    backgroundColor: p.accent ? "var(--color-accent)" : "transparent",
                    color: p.accent ? "var(--color-accent-text)" : "#1b3a4b",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderRadius: "9999px",
                    border: p.accent ? "none" : "1px solid #d1d5db",
                    textDecoration: "none",
                  }}
                >
                  {isFr ? p.ctaFr : p.ctaEn} →
                </a>
              )}
            </div>
          ))}

          {/* Closing note */}
          <p style={{
            textAlign: "center",
            color: "#6b7280",
            fontSize: "0.9375rem",
            lineHeight: 1.7,
            marginTop: "1rem",
          }}>
            {isFr
              ? "Dans l'étude à venir, nous présenterons les points forts de chacune de ces plateformes."
              : "In the upcoming study, we will present the strengths of each of these platforms."}
          </p>
        </div>
      </section>
    </div>
  );
}
