"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TrackCategory } from "@/types/track";

type Props = {
  categories: TrackCategory[];
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  locale: string;
};

export default function CatalogueHero({
  categories,
  heroTitle,
  heroSubtitle,
  heroDescription,
  locale,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStyle = searchParams.get("style") ?? "";

  function selectStyle(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug && currentStyle !== slug) {
      params.set("style", slug);
    } else {
      params.delete("style");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <section
      style={{
        position: "relative",
        backgroundImage: "url(/catalogue-hero.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "5rem 1.5rem 3.5rem",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(27, 58, 75, 0.82)",
        }}
      />

      <div style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}>
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-poppins, Poppins, sans-serif)",
            fontWeight: 600,
            fontSize: "1.25rem",
            color: "white",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {heroTitle}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-poppins, Poppins, sans-serif)",
            fontWeight: 800,
            fontSize: "2.5rem",
            color: "white",
            margin: "0.25rem 0 0.75rem",
            lineHeight: 1.2,
          }}
        >
          {heroSubtitle}
        </p>

        {/* Description */}
        <p
          style={{
            fontFamily: "var(--font-poppins, Poppins, sans-serif)",
            fontWeight: 400,
            fontSize: "0.9375rem",
            color: "rgba(255, 255, 255, 0.8)",
            margin: "0 0 1.75rem",
            maxWidth: "550px",
            lineHeight: 1.6,
          }}
        >
          {heroDescription}
        </p>

        {/* Style filter chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            maxWidth: "550px",
          }}
        >
          {categories.map((cat) => {
            const isActive = currentStyle === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => selectStyle(cat.slug)}
                style={{
                  padding: "0.5rem 1.5rem",
                  borderRadius: "9999px",
                  border: isActive ? "2px solid var(--color-accent)" : "1px solid rgba(255, 255, 255, 0.5)",
                  backgroundColor: isActive ? "var(--color-accent)" : "transparent",
                  color: isActive ? "var(--color-accent-text)" : "white",
                  fontSize: "0.9375rem",
                  fontFamily: "var(--font-poppins, Poppins, sans-serif)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  minWidth: "120px",
                  textAlign: "center",
                }}
              >
                {locale === "fr" ? cat.labelFr : cat.labelEn}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
