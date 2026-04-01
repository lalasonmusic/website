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

    // If the query looks like natural language (more than 2 words or contains common phrases)
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

    // Fallback: regular text search
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const themes = categories.filter((c) => c.type === "THEME");
  const moods = categories.filter((c) => c.type === "MOOD");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
      {/* Smart Search */}
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
            padding: "0.75rem 1rem",
            paddingRight: isSearching ? "3rem" : "1rem",
            backgroundColor: darkMode ? "rgba(255, 255, 255, 0.15)" : "#f9fafb",
            border: darkMode ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid #d1d5db",
            borderRadius: "8px",
            color: darkMode ? "white" : "#1b3a4b",
            fontSize: "0.9375rem",
          }}
        />
        {isSearching && (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.8125rem",
              color: "var(--color-accent)",
            }}
          >
            ✨
          </span>
        )}
      </div>

      {/* Filter rows — theme & mood only (style is in the hero) */}
      {(themes.length > 0 || moods.length > 0) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <FilterGroup
            label={filterLabels.theme}
            options={themes}
            current={currentTheme}
            allLabel={filterLabels.all}
            onChange={(v) => updateParam("theme", v)}
            darkMode={darkMode}
          />
          <FilterGroup
            label={filterLabels.mood}
            options={moods}
            current={currentMood}
            allLabel={filterLabels.all}
            onChange={(v) => updateParam("mood", v)}
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
}

type FilterGroupProps = {
  label: string;
  options: TrackCategory[];
  current: string;
  allLabel: string;
  onChange: (v: string) => void;
  darkMode?: boolean;
};

function FilterGroup({ label, options, current, allLabel, onChange, darkMode }: FilterGroupProps) {
  if (options.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: darkMode ? "rgba(255,255,255,0.6)" : "#6b7280", marginRight: "0.25rem" }}>
        {label}:
      </span>
      <FilterChip label={allLabel} active={!current} onClick={() => onChange("")} darkMode={darkMode} />
      {options.map((opt) => (
        <FilterChip
          key={opt.slug}
          label={opt.labelFr}
          active={current === opt.slug}
          onClick={() => onChange(current === opt.slug ? "" : opt.slug)}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
}

function FilterChip({ label, active, onClick, darkMode }: { label: string; active: boolean; onClick: () => void; darkMode?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        border: `1px solid ${active ? "var(--color-accent)" : darkMode ? "rgba(255,255,255,0.4)" : "#d1d5db"}`,
        backgroundColor: active ? (darkMode ? "var(--color-accent)" : "rgba(245,166,35,0.12)") : "transparent",
        color: active ? (darkMode ? "var(--color-accent-text)" : "#b47a14") : darkMode ? "white" : "#4b5563",
        fontSize: "0.8125rem",
        cursor: "pointer",
        fontWeight: active ? 600 : 400,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}
