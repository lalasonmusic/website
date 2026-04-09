"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * Two-pill toggle for the catalogue: Discover (random) ↔ New (newest first).
 * Lives in the catalogue hero, preserves all other query params on switch.
 */
export default function SortToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("catalogue");

  const currentSort = searchParams.get("sort");
  const isNew = currentSort === "new";

  function switchTo(sort: "discover" | "new") {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "new") {
      params.set("sort", "new");
    } else {
      params.delete("sort");
    }
    // Reset pagination when switching sort
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div
      style={{
        display: "inline-flex",
        padding: "0.25rem",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 9999,
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <button
        type="button"
        onClick={() => switchTo("discover")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.5rem 1.1rem",
          borderRadius: 9999,
          border: "none",
          backgroundColor: !isNew ? "var(--color-accent)" : "transparent",
          color: !isNew ? "var(--color-accent-text)" : "rgba(255,255,255,0.7)",
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: "0.8125rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 3 21 8" />
          <line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" />
          <line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
        {t("sortDiscover")}
      </button>

      <button
        type="button"
        onClick={() => switchTo("new")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.5rem 1.1rem",
          borderRadius: 9999,
          border: "none",
          backgroundColor: isNew ? "var(--color-accent)" : "transparent",
          color: isNew ? "var(--color-accent-text)" : "rgba(255,255,255,0.7)",
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: "0.8125rem",
          cursor: "pointer",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
        </svg>
        {t("sortNew")}
      </button>
    </div>
  );
}
