"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TrackCategory } from "@/types/track";

type Props = {
  categories: TrackCategory[];
  locale: string;
};

export default function StyleFilterChips({ categories, locale }: Props) {
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
  );
}
