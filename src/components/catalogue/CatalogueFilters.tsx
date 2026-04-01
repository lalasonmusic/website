"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import type { TrackCategory } from "@/types/track";

type Props = {
  categories: TrackCategory[];
  searchPlaceholder: string;
  filterLabels: { style: string; theme: string; mood: string; all: string };
  locale: string;
  darkMode?: boolean;
};

export default function CatalogueFilters({ categories, filterLabels, locale, darkMode }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const currentSearch = searchParams.get("q") ?? "";
  const currentStyle = searchParams.get("style") ?? "";
  const currentTheme = searchParams.get("theme") ?? "";
  const currentMood = searchParams.get("mood") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setFilters(filters: { styles: string[]; moods: string[]; themes: string[]; keywords: string[] }) {
    const params = new URLSearchParams();
    if (filters.styles[0]) params.set("style", filters.styles[0]);
    if (filters.moods[0]) params.set("mood", filters.moods[0]);
    if (filters.themes[0]) params.set("theme", filters.themes[0]);
    if (filters.keywords[0]) params.set("q", filters.keywords[0]);
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 3) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }

    const isNaturalLanguage = value.split(/\s+/).length > 2 || /pour|for|cherche|looking|besoin|need|want|veux/i.test(value);

    if (isNaturalLanguage) {
      setIsSearching(true);
      try {
        const res = await fetch("/api/search/smart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: value }),
        });
        if (res.ok) {
          const data = await res.json();
          setFilters(data);
          setIsSearching(false);
          return;
        }
      } catch {}
      setIsSearching(false);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("q", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const styles = categories.filter((c) => c.type === "STYLE");
  const themes = categories.filter((c) => c.type === "THEME");
  const moods = categories.filter((c) => c.type === "MOOD");

  const selectBase: React.CSSProperties = {
    padding: "0.5rem 2rem 0.5rem 0.75rem",
    borderRadius: "8px",
    border: darkMode ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid #d1d5db",
    backgroundColor: darkMode ? "rgba(255, 255, 255, 0.1)" : "white",
    color: darkMode ? "white" : "#1b3a4b",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${darkMode ? "rgba(255,255,255,0.7)" : "%236b7280"}' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.625rem center",
    minWidth: "120px",
  };

  const activeSelectStyle: React.CSSProperties = {
    ...selectBase,
    border: "1px solid var(--color-accent)",
    backgroundColor: darkMode ? "rgba(245, 166, 35, 0.2)" : "rgba(245,166,35,0.1)",
    color: darkMode ? "var(--color-accent)" : "#b47a14",
    fontWeight: 600,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "0.5rem" }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <input
          type="search"
          defaultValue={currentSearch}
          placeholder={locale === "fr"
            ? "Rechercher ou décrire ce que vous cherchez... ex: \"musique pour un mariage\""
            : "Search or describe what you need... e.g. \"music for a wedding\""
          }
          onChange={(e) => {
            const val = e.target.value;
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => handleSearch(val), 600);
          }}
          style={{
            width: "100%",
            padding: "0.875rem 1.25rem",
            paddingRight: isSearching ? "3rem" : "1.25rem",
            backgroundColor: darkMode ? "rgba(255, 255, 255, 0.12)" : "#f9fafb",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.25)" : "1px solid #d1d5db",
            borderRadius: "12px",
            color: darkMode ? "white" : "#1b3a4b",
            fontSize: "1rem",
          }}
        />
        {isSearching && (
          <span
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.875rem",
              color: "var(--color-accent)",
            }}
          >
            ✨
          </span>
        )}
      </div>

      {/* 3 compact dropdown selects on one row */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {styles.length > 0 && (
          <select
            value={currentStyle}
            onChange={(e) => updateParam("style", e.target.value)}
            style={currentStyle ? activeSelectStyle : selectBase}
          >
            <option value="">{filterLabels.style}</option>
            {styles.map((s) => (
              <option key={s.slug} value={s.slug}>
                {locale === "fr" ? s.labelFr : s.labelEn}
              </option>
            ))}
          </select>
        )}
        {themes.length > 0 && (
          <select
            value={currentTheme}
            onChange={(e) => updateParam("theme", e.target.value)}
            style={currentTheme ? activeSelectStyle : selectBase}
          >
            <option value="">{filterLabels.theme}</option>
            {themes.map((t) => (
              <option key={t.slug} value={t.slug}>
                {locale === "fr" ? t.labelFr : t.labelEn}
              </option>
            ))}
          </select>
        )}
        {moods.length > 0 && (
          <select
            value={currentMood}
            onChange={(e) => updateParam("mood", e.target.value)}
            style={currentMood ? activeSelectStyle : selectBase}
          >
            <option value="">{filterLabels.mood}</option>
            {moods.map((m) => (
              <option key={m.slug} value={m.slug}>
                {locale === "fr" ? m.labelFr : m.labelEn}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
