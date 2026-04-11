import type { Metadata } from "next";
import { Countdown } from "./Countdown";

export const metadata: Metadata = {
  title: "Bientôt disponible — Lalason",
  description:
    "Une nouvelle plateforme pour trouver, écouter et télécharger de la musique libre de droits. Ouverture mardi 14 avril 2026.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background:
          "radial-gradient(ellipse at top, var(--color-bg-card) 0%, var(--color-bg-primary) 60%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "42rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-poppins)",
            fontWeight: 800,
            fontSize: "clamp(2.5rem, 8vw, 4rem)",
            letterSpacing: "-0.03em",
            color: "var(--color-text-primary)",
            marginBottom: "3rem",
          }}
        >
          Lalason
        </div>

        <h1
          style={{
            fontFamily: "var(--font-poppins)",
            fontWeight: 800,
            fontSize: "clamp(1.75rem, 5vw, 2.75rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--color-text-primary)",
            marginBottom: "1rem",
          }}
        >
          Le nouveau Lalason arrive Mardi
        </h1>

        <p
          style={{
            fontFamily: "var(--font-poppins)",
            fontWeight: 400,
            fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
            lineHeight: 1.6,
            color: "var(--color-text-secondary)",
            maxWidth: "34rem",
            margin: "0 auto 3rem",
          }}
        >
          Une nouvelle plateforme pour trouver, écouter et télécharger de la
          musique libre de droits. Rendez-vous mardi 14 avril pour la découvrir.
        </p>

        <Countdown />
      </div>
    </main>
  );
}
